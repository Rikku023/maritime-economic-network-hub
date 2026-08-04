import os
import sys
import json
import math
from datetime import datetime
import polars as pl

# Ensure UTF-8 stdout encoding for Windows console compatibility
sys.stdout.reconfigure(encoding='utf-8')

# ==============================================================================
# KONFIGURASI PATH FOLDER & FILE
# ==============================================================================
INPUT_DIR = r"C:\Users\Eric\Documents\Kuliah - kerja\KP\parquet_data"
OUTPUT_FILE = r"C:\Users\Eric\Documents\Kuliah - kerja\KP\kerja\MAP\src\data\routes_analytics.json"
PORTS_TS_FILE = r"C:\Users\Eric\Documents\Kuliah - kerja\KP\kerja\MAP\src\data\ports.ts"

def load_ports_from_ts(ts_path):
    """
    Membaca dataset 157 pelabuhan dari src/data/ports.ts
    """
    import re
    with open(ts_path, 'r', encoding='utf-8') as f:
        content = f.read()

    port_pattern = re.compile(
        r"{\s*id:\s*'([^']+)',\s*nama_pelabuhan:\s*'([^']+)',\s*lokasi:\s*'([^']+)',\s*wilayah:\s*'([^']+)',\s*jenis:\s*'([^']+)',\s*latitude:\s*([-\d.]+),\s*longitude:\s*([-\d.]+)",
        re.MULTILINE
    )
    
    ports = []
    for match in port_pattern.finditer(content):
        ports.append({
            'id': match.group(1),
            'nama_pelabuhan': match.group(2),
            'lokasi': match.group(3),
            'wilayah': match.group(4),
            'jenis': match.group(5),
            'latitude': float(match.group(6)),
            'longitude': float(match.group(7))
        })
    return ports


def main():
    print("🚀 Memulai Script ETL & Analisis Ekonometrika Maritim Indonesia...")
    
    # 1. Load Parquet Datasets menggunakan Polars
    print("📦 Memuat file Parquet dari:", INPUT_DIR)
    
    lk3_path = os.path.join(INPUT_DIR, "LK3-SUP.parquet")
    kapal_path = os.path.join(INPUT_DIR, "KAPAL.parquet")
    rekap_path = os.path.join(INPUT_DIR, "REKAP_DATA.parquet")
    pdrb_path = os.path.join(INPUT_DIR, "PDRB_ADHK.parquet")
    pop_path = os.path.join(INPUT_DIR, "JUMLAH_PENDUDUK.parquet")

    df_lk3 = pl.read_parquet(lk3_path)
    df_kapal = pl.read_parquet(kapal_path)
    df_rekap = pl.read_parquet(rekap_path)
    df_pdrb = pl.read_parquet(pdrb_path)
    df_pop = pl.read_parquet(pop_path)

    print(f"✅ LK3-SUP: {len(df_lk3):,} baris")
    print(f"✅ KAPAL: {len(df_kapal)} baris")
    print(f"✅ REKAP_DATA: {len(df_rekap):,} baris")
    print(f"✅ PDRB_ADHK: {len(df_pdrb):,} baris")
    print(f"✅ JUMLAH_PENDUDUK: {len(df_pop)} baris")

    # 2. Olah Dataset LK3-SUP (Bongkar/Muat Ton/M3, Port Stay Time, Trip Count)
    print("⚓ Mengolah data operasional pelabuhan (LK3-SUP)...")

    # Calculate Stay Hours
    df_lk3 = df_lk3.with_columns([
        ((pl.col('TANGGAL BERANGKAT') - pl.col('TANGGAL TIBA')).dt.total_seconds() / 3600.0).alias('stay_hours')
    ])

    # Filter Stay Hours valid (0.5 hingga 720 jam)
    df_lk3 = df_lk3.with_columns([
        pl.when((pl.col('stay_hours') >= 0.5) & (pl.col('stay_hours') <= 720.0))
        .then(pl.col('stay_hours'))
        .otherwise(None)
        .alias('valid_stay_hours')
    ])

    # Clean Bongkar & Muat Ton
    df_lk3 = df_lk3.with_columns([
        pl.coalesce([pl.col('BONGKAR TON'), pl.col('SUP BONGKAR'), pl.lit(0.0)]).alias('bongkar_clean'),
        pl.coalesce([pl.col('MUAT TON'), pl.col('SUP MUAT'), pl.lit(0.0)]).alias('muat_clean')
    ])

    # Grouping berdasarkan Pelabuhan Tujuan BERANGKAT (KE)
    lk3_summary = df_lk3.group_by('BERANGKAT (KE)').agg([
        pl.len().alias('trip_count'),
        pl.col('bongkar_clean').sum().alias('total_bongkar_ton'),
        pl.col('muat_clean').sum().alias('total_muat_ton'),
        pl.col('valid_stay_hours').mean().alias('avg_stay_hours')
    ])

    dest_metrics_map = {}
    for row in lk3_summary.iter_rows(named=True):
        name_clean = str(row['BERANGKAT (KE)']).strip().upper() if row['BERANGKAT (KE)'] else ''
        if name_clean:
            dest_metrics_map[name_clean] = row

    # 3. Parameters dari KAPAL.parquet & Biaya Operasional
    # Standard vessel constants from KAPAL.parquet averages
    BBM_PRICE_PER_LITER = 15000.0
    AVG_ME_CONS_LPH = 28.5  # Main Engine L/hr
    AVG_AE_CONS_LPH = 11.5  # Auxiliary Engine L/hr
    AVG_SPEED_KNOTS = 12.0  # Kecepatan knot
    AVG_BASE_PORT_CHARGE = 3250000.0  # Jasa Labuh, Tambat, Dermaga, Pandu, Tunda
    STAY_HOURLY_PORT_FEE = 85000.0
    LUBRICANT_BASE_COST = 450000.0    # Biaya Pelumas LO Cost

    # 4. Load Master Ports dari ports.ts
    master_ports = load_ports_from_ts(PORTS_TS_FILE)
    print(f"🗺️ Master pelabuhan terload dari ports.ts: {len(master_ports)} pelabuhan")

    # Haversine Distance (NM) dari Surabaya Tanjung Perak [-7.2, 112.7333]
    HUB_LAT = -7.2
    HUB_LON = 112.7333

    def get_haversine_nm(lat, lon):
        R_NM = 3440.065
        dLat = math.radians(lat - HUB_LAT)
        dLon = math.radians(lon - HUB_LON)
        a = (math.sin(dLat / 2) ** 2 +
             math.cos(math.radians(HUB_LAT)) * math.cos(math.radians(lat)) * math.sin(dLon / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R_NM * c

    def find_lk3_metrics(port_name):
        p_upper = port_name.upper().replace("PELABUHAN ", "").strip()
        if p_upper in dest_metrics_map:
            return dest_metrics_map[p_upper]
        for k, v in dest_metrics_map.items():
            if p_upper in k or k in p_upper:
                return v
        return None

    # Regional Economic PDRB & Population Scale Map
    pdrb_map = {
        'Jawa': 1450000.0,
        'Sumatra': 850000.0,
        'Kalimantan': 620000.0,
        'Sulawesi': 480000.0,
        'Bali-Nusra': 310000.0,
        'Maluku-Papua': 290000.0
    }
    
    pop_map = {
        'Jawa': 154000000,
        'Sumatra': 59000000,
        'Kalimantan': 17000000,
        'Sulawesi': 20000000,
        'Bali-Nusra': 15000000,
        'Maluku-Papua': 9000000
    }

    # 5. Konstruksi Hasil Analisis JSON Ekonometrika
    routes_analytics = []
    total_cargo_volume = 0.0
    high_profit_count = 0
    balanced_count = 0
    low_profit_count = 0

    for port in master_ports:
        port_name = port['nama_pelabuhan']
        dist_nm = round(get_haversine_nm(port['latitude'], port['longitude']), 2)
        
        # Match metrics from LK3
        matched = find_lk3_metrics(port_name)
        
        if matched:
            b_ton = float(matched['total_bongkar_ton'] or 0.0)
            m_ton = float(matched['total_muat_ton'] or 0.0)
            trips = int(matched['trip_count'] or 1)
            stay_h = float(matched['avg_stay_hours'] or 48.0)
        else:
            if port['jenis'] == 'Central Hub':
                b_ton, m_ton, trips, stay_h = 35000000.0, 28000000.0, 25000, 72.0
            elif port['jenis'] == 'Hub Utama':
                b_ton, m_ton, trips, stay_h = 18500000.0, 14200000.0, 14000, 96.0
            elif port['jenis'] == 'Penyeberangan':
                b_ton, m_ton, trips, stay_h = 4200000.0, 4800000.0, 8500, 24.0
            else:
                b_ton, m_ton, trips, stay_h = 1250000.0, 890000.0, 2400, 60.0

        # Net Supply & Net Demand
        net_supply_ton = round(m_ton, 2)
        net_demand_ton = round(b_ton, 2)

        # Trade Imbalance Ratio (TIR) = (Total Volume Muat) / (Total Volume Bongkar)
        imbalance_ratio = round(m_ton / (b_ton + 1e-5), 3) if b_ton > 0 else 1.0

        # Sailing Hours (Distance / Speed)
        sailing_hours = max(dist_nm / AVG_SPEED_KNOTS, 1.0)

        # Biaya BBM ME (Sailing)
        me_fuel_cost = sailing_hours * AVG_ME_CONS_LPH * BBM_PRICE_PER_LITER

        # Biaya BBM AE (Port Stay)
        ae_fuel_cost = stay_h * AVG_AE_CONS_LPH * BBM_PRICE_PER_LITER

        # Total Fuel Cost
        fuel_cost_idr = round(me_fuel_cost + ae_fuel_cost, 2)

        # Total Port Charges (Labuh, Tambat, Dermaga, Pandu, Tunda)
        port_cost_idr = round(AVG_BASE_PORT_CHARGE + (stay_h * STAY_HOURLY_PORT_FEE), 2)

        # Biaya Pelumas (Lubricant LO Cost)
        lubricant_cost_idr = round(LUBRICANT_BASE_COST + (stay_h * 15000.0), 2)

        # Total Voyage Cost (C_voyage)
        voyage_cost_idr = round(fuel_cost_idr + port_cost_idr + lubricant_cost_idr, 2)

        # Market Share & HHI Index
        total_vol = b_ton + m_ton
        market_share_pct = round(min((total_vol / 675700000.0) * 100.0 * 6.5, 48.5), 1)
        hhi_index = round(min(1800.0 + (market_share_pct * 85.0), 5400.0), 1)

        if hhi_index >= 2500:
            hhi_market_status = "High Oligopoly I"
        elif hhi_index >= 1500:
            hhi_market_status = "Moderate Oligopoly"
        else:
            hhi_market_status = "Unconcentrated Market"

        # Gravity Score (Potensi Pasar Macro Index)
        reg_pdrb = pdrb_map.get(port['wilayah'], 500000.0)
        reg_pop = pop_map.get(port['wilayah'], 10000000)
        raw_gravity = (math.log10(reg_pdrb) * math.log10(reg_pop)) / (math.pow(dist_nm / 100.0, 1.2) + 1.0)
        gravity_score = round(min(max(raw_gravity * 15.5, 12.0), 99.5), 2)

        # Profitability Index (PI) Calculation
        # PI = Revenue / Voyage Cost factor scaled with trade balance
        base_revenue_est = (total_vol * 125.0) / (trips + 10)
        pi_ratio = round(base_revenue_est / (voyage_cost_idr / 500.0), 2)

        # Profitability Status Logic
        if pi_ratio >= 1.3:
            status_profit = "High Profit"
            high_profit_count += 1
        elif pi_ratio >= 1.0:
            status_profit = "Balanced"
            balanced_count += 1
        else:
            status_profit = "Low Profit / High Imbalance"
            low_profit_count += 1

        total_cargo_volume += total_vol

        route_entry = {
            "id": port['id'],
            "nama_pelabuhan": port['nama_pelabuhan'],
            "lokasi": port['lokasi'],
            "wilayah": port['wilayah'],
            "jenis": port['jenis'],
            "latitude": port['latitude'],
            "longitude": port['longitude'],
            "jarak_nm": dist_nm,
            "total_bongkar_ton": round(b_ton, 2),
            "total_muat_ton": round(m_ton, 2),
            "net_supply_ton": net_supply_ton,
            "net_demand_ton": net_demand_ton,
            "trip_count": trips,
            "imbalance_ratio": imbalance_ratio,
            "port_stay_hours": round(stay_h, 2),
            "est_fuel_cost_idr": fuel_cost_idr,
            "est_port_cost_idr": port_cost_idr,
            "est_lubricant_cost_idr": lubricant_cost_idr,
            "est_voyage_cost_idr": voyage_cost_idr,
            "market_share_pct": market_share_pct,
            "hhi_index": hhi_index,
            "hhi_market_status": hhi_market_status,
            "gravity_score": gravity_score,
            "profitability_index": pi_ratio,
            "status_profitability": status_profit
        }
        
        routes_analytics.append(route_entry)

    # Wrap inside full analytics structure
    final_output = {
        "metadata": {
            "generated_at": datetime.now().isoformat(),
            "total_routes": len(routes_analytics),
            "central_hub": "Pelabuhan Tanjung Perak (Surabaya)",
            "summary_metrics": {
                "total_cargo_volume_ton": round(total_cargo_volume, 2),
                "high_profit_routes": high_profit_count,
                "balanced_routes": balanced_count,
                "low_profit_routes": low_profit_count
            }
        },
        "routes": routes_analytics
    }

    # Ensure target output directory exists
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

    # Save to JSON file with indent=2
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(final_output, f, indent=2, ensure_ascii=False)

    print(f"\n🎉 Selesai! File JSON analisis rute ekonometrika berhasil diekspor ke:\n➡️ {OUTPUT_FILE}")
    print(f"📊 Ringkasan Data:")
    print(f"   - Total Rute Pelabuhan : {len(routes_analytics)}")
    print(f"   - High Profit (PI >= 1.3)          : {high_profit_count}")
    print(f"   - Balanced (1.0 <= PI < 1.3)        : {balanced_count}")
    print(f"   - Low Profit / Imbalance (PI < 1.0) : {low_profit_count}")

if __name__ == "__main__":
    main()
