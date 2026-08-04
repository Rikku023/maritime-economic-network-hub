import streamlit as st
import pandas as pd
import numpy as np
import pydeck as pdk
import streamlit.components.v1 as components
import json

# ==============================================================================
# 1. KONFIGURASI HALAMAN STREAMLIT & STYLING CUSTOM
# ==============================================================================
st.set_page_config(
    page_title="Jaringan Pelayaran Indonesia - Central Hub Surabaya",
    page_icon="🚢",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS Glassmorphism Dark Mode
st.markdown("""
    <style>
    .stApp {
        background-color: #080c14;
        color: #f1f5f9;
    }
    
    /* Header Container */
    .main-header {
        background: linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.75) 100%);
        border: 1px solid rgba(56, 189, 248, 0.2);
        border-radius: 16px;
        padding: 20px 28px;
        margin-bottom: 20px;
        box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(12px);
    }
    
    .main-header h1 {
        color: #38bdf8;
        font-size: 2.1rem;
        font-weight: 700;
        margin-bottom: 4px;
        letter-spacing: -0.5px;
    }
    
    .main-header p {
        color: #94a3b8;
        font-size: 1.02rem;
        margin: 0;
    }
    
    /* Metric Card Styling */
    .metric-card {
        background: rgba(15, 23, 42, 0.7);
        border: 1px solid rgba(56, 189, 248, 0.25);
        border-radius: 12px;
        padding: 16px 20px;
        box-shadow: 0 4px 18px rgba(0, 0, 0, 0.35);
        transition: transform 0.2s ease, border-color 0.2s ease;
    }
    
    .metric-card:hover {
        transform: translateY(-2px);
        border-color: rgba(56, 189, 248, 0.6);
    }
    
    .metric-label {
        color: #94a3b8;
        font-size: 0.82rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
    }
    
    .metric-value {
        color: #f8fafc;
        font-size: 1.55rem;
        font-weight: 700;
    }
    
    .metric-subtitle {
        color: #38bdf8;
        font-size: 0.88rem;
        font-weight: 500;
        margin-top: 2px;
    }
    
    /* Legend Styling */
    .legend-box {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
        align-items: center;
        background: rgba(15, 23, 42, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 10px 16px;
        margin-bottom: 12px;
    }
    
    .legend-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.85rem;
        color: #cbd5e1;
    }
    
    .legend-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
    }
    
    section[data-testid="stSidebar"] {
        background-color: #0b1120 !important;
        border-right: 1px solid rgba(255, 255, 255, 0.08);
    }
    </style>
""", unsafe_allow_html=True)


# ==============================================================================
# 2. GENERATE DATASET & HITUNGAN JARAK HAVERSINE (NAUTICAL MILES)
# ==============================================================================
HUB_NAME = "Pelabuhan Tanjung Perak"
HUB_LAT = -7.1992
HUB_LON = 112.7378

def calculate_haversine_nm(lat1, lon1, lat2, lon2):
    """
    Menghitung jarak lingkaran besar (Great Circle Distance) antara dua titik koordinat
    dalam satuan Nautical Miles (NM). 1 NM = 1.852 KM.
    Jari-jari Bumi R ≈ 3440.065 NM.
    """
    R_NM = 3440.065
    phi1, phi2 = np.radians(lat1), np.radians(lat2)
    delta_phi = np.radians(lat2 - lat1)
    delta_lambda = np.radians(lon2 - lon1)
    
    a = (np.sin(delta_phi / 2.0) ** 2 + 
         np.cos(phi1) * np.cos(phi2) * np.sin(delta_lambda / 2.0) ** 2)
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))
    
    return R_NM * c

@st.cache_data
def get_port_dataset():
    raw_ports = [
        # JAWA
        {"nama_pelabuhan": "Pelabuhan Tanjung Perak", "kota_provinsi": "Surabaya, Jawa Timur", "latitude": -7.1992, "longitude": 112.7378, "kategori_wilayah": "Jawa", "tipe_pelabuhan": "Central Hub"},
        {"nama_pelabuhan": "Pelabuhan Tanjung Priok", "kota_provinsi": "Jakarta, DKI Jakarta", "latitude": -6.1011, "longitude": 106.8837, "kategori_wilayah": "Jawa", "tipe_pelabuhan": "Hub"},
        {"nama_pelabuhan": "Pelabuhan Tanjung Emas", "kota_provinsi": "Semarang, Jawa Tengah", "latitude": -6.9536, "longitude": 110.4289, "kategori_wilayah": "Jawa", "tipe_pelabuhan": "Feeder"},
        {"nama_pelabuhan": "Pelabuhan Merak", "kota_provinsi": "Cilegon, Banten", "latitude": -5.9333, "longitude": 105.9989, "kategori_wilayah": "Jawa", "tipe_pelabuhan": "Penyeberangan"},
        {"nama_pelabuhan": "Pelabuhan Ketapang", "kota_provinsi": "Banyuwangi, Jawa Timur", "latitude": -8.1481, "longitude": 114.3970, "kategori_wilayah": "Jawa", "tipe_pelabuhan": "Penyeberangan"},

        # SUMATRA
        {"nama_pelabuhan": "Pelabuhan Belawan", "kota_provinsi": "Medan, Sumatra Utara", "latitude": 3.7844, "longitude": 98.6908, "kategori_wilayah": "Sumatra", "tipe_pelabuhan": "Hub"},
        {"nama_pelabuhan": "Pelabuhan Teluk Bayur", "kota_provinsi": "Padang, Sumatra Barat", "latitude": -0.9972, "longitude": 100.3694, "kategori_wilayah": "Sumatra", "tipe_pelabuhan": "Feeder"},
        {"nama_pelabuhan": "Pelabuhan Bakauheni", "kota_provinsi": "Lampung Selatan, Lampung", "latitude": -5.8672, "longitude": 105.7533, "kategori_wilayah": "Sumatra", "tipe_pelabuhan": "Penyeberangan"},
        {"nama_pelabuhan": "Pelabuhan Boom Baru", "kota_provinsi": "Palembang, Sumatra Selatan", "latitude": -2.9733, "longitude": 104.7700, "kategori_wilayah": "Sumatra", "tipe_pelabuhan": "Feeder"},
        {"nama_pelabuhan": "Pelabuhan Batu Ampar", "kota_provinsi": "Batam, Kepulauan Riau", "latitude": 1.1542, "longitude": 104.0153, "kategori_wilayah": "Sumatra", "tipe_pelabuhan": "Hub"},

        # KALIMANTAN
        {"nama_pelabuhan": "Pelabuhan Semayang", "kota_provinsi": "Balikpapan, Kalimantan Timur", "latitude": -1.2789, "longitude": 116.8042, "kategori_wilayah": "Kalimantan", "tipe_pelabuhan": "Hub"},
        {"nama_pelabuhan": "Pelabuhan Trisakti", "kota_provinsi": "Banjarmasin, Kalimantan Selatan", "latitude": -3.3308, "longitude": 114.5683, "kategori_wilayah": "Kalimantan", "tipe_pelabuhan": "Feeder"},
        {"nama_pelabuhan": "Pelabuhan Dwikora", "kota_provinsi": "Pontianak, Kalimantan Barat", "latitude": -0.0244, "longitude": 109.3444, "kategori_wilayah": "Kalimantan", "tipe_pelabuhan": "Feeder"},
        {"nama_pelabuhan": "Pelabuhan Malundung", "kota_provinsi": "Tarakan, Kalimantan Utara", "latitude": 3.2842, "longitude": 117.5856, "kategori_wilayah": "Kalimantan", "tipe_pelabuhan": "Feeder"},

        # SULAWESI
        {"nama_pelabuhan": "Pelabuhan Soekarno-Hatta", "kota_provinsi": "Makassar, Sulawesi Selatan", "latitude": -5.1189, "longitude": 119.4144, "kategori_wilayah": "Sulawesi", "tipe_pelabuhan": "Hub"},
        {"nama_pelabuhan": "Pelabuhan Bitung", "kota_provinsi": "Bitung, Sulawesi Utara", "latitude": 1.4428, "longitude": 125.1919, "kategori_wilayah": "Sulawesi", "tipe_pelabuhan": "Hub"},
        {"nama_pelabuhan": "Pelabuhan Pantoloan", "kota_provinsi": "Palu, Sulawesi Tengah", "latitude": -0.7061, "longitude": 119.8603, "kategori_wilayah": "Sulawesi", "tipe_pelabuhan": "Feeder"},
        {"nama_pelabuhan": "Pelabuhan Kendari", "kota_provinsi": "Kendari, Sulawesi Tenggara", "latitude": -3.9789, "longitude": 122.5853, "kategori_wilayah": "Sulawesi", "tipe_pelabuhan": "Feeder"},

        # BALI & NUSA TENGGARA
        {"nama_pelabuhan": "Pelabuhan Benoa", "kota_provinsi": "Denpasar, Bali", "latitude": -8.7453, "longitude": 115.2125, "kategori_wilayah": "Bali-Nusra", "tipe_pelabuhan": "Feeder"},
        {"nama_pelabuhan": "Pelabuhan Lembar", "kota_provinsi": "Lombok Barat, NTB", "latitude": -8.7303, "longitude": 116.0736, "kategori_wilayah": "Bali-Nusra", "tipe_pelabuhan": "Penyeberangan"},
        {"nama_pelabuhan": "Pelabuhan Tenau", "kota_provinsi": "Kupang, NTT", "latitude": -10.1878, "longitude": 123.5350, "kategori_wilayah": "Bali-Nusra", "tipe_pelabuhan": "Feeder"},

        # MALUKU
        {"nama_pelabuhan": "Pelabuhan Yos Sudarso", "kota_provinsi": "Ambon, Maluku", "latitude": -3.6931, "longitude": 128.1814, "kategori_wilayah": "Maluku", "tipe_pelabuhan": "Hub"},
        {"nama_pelabuhan": "Pelabuhan Ahmad Yani", "kota_provinsi": "Ternate, Maluku Utara", "latitude": 0.7872, "longitude": 127.3878, "kategori_wilayah": "Maluku", "tipe_pelabuhan": "Feeder"},

        # PAPUA
        {"nama_pelabuhan": "Pelabuhan Jayapura", "kota_provinsi": "Jayapura, Papua", "latitude": -2.5369, "longitude": 140.7181, "kategori_wilayah": "Papua", "tipe_pelabuhan": "Hub"},
        {"nama_pelabuhan": "Pelabuhan Sorong", "kota_provinsi": "Sorong, Papua Barat Daya", "latitude": -0.8756, "longitude": 131.2547, "kategori_wilayah": "Papua", "tipe_pelabuhan": "Hub"},
        {"nama_pelabuhan": "Pelabuhan Merauke", "kota_provinsi": "Merauke, Papua Selatan", "latitude": -8.4900, "longitude": 140.3956, "kategori_wilayah": "Papua", "tipe_pelabuhan": "Feeder"},
        {"nama_pelabuhan": "Pelabuhan Biak", "kota_provinsi": "Biak Numfor, Papua", "latitude": -1.1822, "longitude": 136.0903, "kategori_wilayah": "Papua", "tipe_pelabuhan": "Feeder"}
    ]
    
    df = pd.DataFrame(raw_ports)
    
    df["jarak_nm"] = df.apply(
        lambda row: round(calculate_haversine_nm(HUB_LAT, HUB_LON, row["latitude"], row["longitude"]), 2),
        axis=1
    )
    
    df["hub_lat"] = HUB_LAT
    df["hub_lon"] = HUB_LON
    
    def assign_color_hex(tipe):
        if tipe == "Central Hub":
            return "#f43f5e" # Neon Crimson
        elif tipe == "Hub":
            return "#f59e0b" # Amber Gold
        elif tipe == "Feeder":
            return "#00e5ff" # Bright Cyan
        else:
            return "#10b981" # Emerald Green

    def assign_color_rgba(tipe):
        if tipe == "Central Hub":
            return [244, 63, 94, 255]
        elif tipe == "Hub":
            return [245, 158, 11, 235]
        elif tipe == "Feeder":
            return [0, 229, 255, 220]
        else:
            return [16, 185, 129, 220]

    def assign_radius(tipe):
        if tipe == "Central Hub":
            return 32000
        elif tipe == "Hub":
            return 22000
        elif tipe == "Feeder":
            return 14000
        else:
            return 12000

    df["color_hex"] = df["tipe_pelabuhan"].apply(assign_color_hex)
    df["color_rgba"] = df["tipe_pelabuhan"].apply(assign_color_rgba)
    df["radius_m"] = df["tipe_pelabuhan"].apply(assign_radius)
    
    return df

df_master = get_port_dataset()


# ==============================================================================
# 3. SIDEBAR CONTROLS & FILTER
# ==============================================================================
st.sidebar.markdown("### 🛠️ Filter & Pengaturan")

all_wilayah = sorted(list(df_master["kategori_wilayah"].unique()))
selected_wilayah = st.sidebar.multiselect(
    "📍 Kategori Wilayah",
    options=all_wilayah,
    default=all_wilayah,
    help="Pilih wilayah pelabuhan"
)

all_tipe = list(df_master["tipe_pelabuhan"].unique())
selected_tipe = st.sidebar.multiselect(
    "⚓ Tipe Pelabuhan",
    options=all_tipe,
    default=all_tipe,
    help="Pilih tipe hirarki pelabuhan"
)

st.sidebar.markdown("---")
st.sidebar.markdown("### 🌐 Modus Garis Rute Pelayaran")
route_visibility_mode = st.sidebar.radio(
    "Visibilitas Garis Rute (Arc):",
    options=["Hanya Saat Hover Cursor (Default)", "Tampilkan Semua Garis Rute"],
    index=0,
    help="Default: Garis rute hanya muncul saat kursor diarahkan ke titik pelabuhan"
)

st.sidebar.markdown("---")
st.sidebar.markdown("### 🗺️ Opsi Tampilan Peta")
map_engine = st.sidebar.selectbox(
    "Gaya Visualisasi Peta:",
    options=["Peta Satelit Indonesia Interaktif (Rekomendasi)", "Peta 3D PyDeck"],
    index=0
)

pitch_angle = st.sidebar.slider(
    "Kemiringan Kamera 3D (PyDeck Pitch)",
    min_value=0, max_value=75, value=45, step=5
)

# Apply Filter
filtered_df = df_master[
    (df_master["kategori_wilayah"].isin(selected_wilayah)) &
    (df_master["tipe_pelabuhan"].isin(selected_tipe))
].copy()


# ==============================================================================
# 4. HEADER & METRIK RINGKASAN
# ==============================================================================
st.markdown(f"""
    <div class="main-header">
        <h1>🚢 Peta Jaringan Pelayaran Indonesia</h1>
        <p>Visualisasi Peta Satelit Interaktif Rute Pelayaran dari <b>Central Hub Pelabuhan Tanjung Perak (Surabaya)</b> ke Seluruh Pelabuhan Nusantara.</p>
    </div>
""", unsafe_allow_html=True)

df_destinations = filtered_df[filtered_df["nama_pelabuhan"] != HUB_NAME]

col1, col2, col3, col4 = st.columns(4)

with col1:
    total_ports = len(filtered_df)
    st.markdown(f"""
        <div class="metric-card">
            <div class="metric-label">Total Pelabuhan Terkoneksi</div>
            <div class="metric-value">{total_ports}</div>
            <div class="metric-subtitle">Termasuk Tanjung Perak</div>
        </div>
    """, unsafe_allow_html=True)

with col2:
    if not df_destinations.empty:
        furthest = df_destinations.loc[df_destinations["jarak_nm"].idxmax()]
        st.markdown(f"""
            <div class="metric-card">
                <div class="metric-label">Rute Terjauh</div>
                <div class="metric-value">{furthest['jarak_nm']:,.1f} <span style="font-size:0.9rem;">NM</span></div>
                <div class="metric-subtitle">{furthest['nama_pelabuhan']} ({furthest['kategori_wilayah']})</div>
            </div>
        """, unsafe_allow_html=True)
    else:
        st.markdown("""
            <div class="metric-card">
                <div class="metric-label">Rute Terjauh</div>
                <div class="metric-value">-</div>
                <div class="metric-subtitle">Tidak ada data</div>
            </div>
        """, unsafe_allow_html=True)

with col3:
    if not df_destinations.empty:
        closest = df_destinations.loc[df_destinations["jarak_nm"].idxmin()]
        st.markdown(f"""
            <div class="metric-card">
                <div class="metric-label">Rute Terdekat</div>
                <div class="metric-value">{closest['jarak_nm']:,.1f} <span style="font-size:0.9rem;">NM</span></div>
                <div class="metric-subtitle">{closest['nama_pelabuhan']} ({closest['kategori_wilayah']})</div>
            </div>
        """, unsafe_allow_html=True)
    else:
        st.markdown("""
            <div class="metric-card">
                <div class="metric-label">Rute Terdekat</div>
                <div class="metric-value">-</div>
                <div class="metric-subtitle">Tidak ada data</div>
            </div>
        """, unsafe_allow_html=True)

with col4:
    if not df_destinations.empty:
        avg_dist = df_destinations["jarak_nm"].mean()
        st.markdown(f"""
            <div class="metric-card">
                <div class="metric-label">Rata-Rata Jarak Rute</div>
                <div class="metric-value">{avg_dist:,.1f} <span style="font-size:0.9rem;">NM</span></div>
                <div class="metric-subtitle">Ke Pelabuhan Tujuan</div>
            </div>
        """, unsafe_allow_html=True)
    else:
        st.markdown("""
            <div class="metric-card">
                <div class="metric-label">Rata-Rata Jarak Rute</div>
                <div class="metric-value">-</div>
                <div class="metric-subtitle">Tidak ada data</div>
            </div>
        """, unsafe_allow_html=True)

st.markdown("<br>", unsafe_allow_html=True)

# Legend Box
st.markdown("""
    <div class="legend-box">
        <div class="legend-item"><div class="legend-dot" style="background:#f43f5e; box-shadow: 0 0 10px #f43f5e;"></div> <b>Central Hub</b> (Tanjung Perak)</div>
        <div class="legend-item"><div class="legend-dot" style="background:#f59e0b; box-shadow: 0 0 6px #f59e0b;"></div> <b>Hub Utama</b></div>
        <div class="legend-item"><div class="legend-dot" style="background:#00e5ff;"></div> <b>Feeder</b></div>
        <div class="legend-item"><div class="legend-dot" style="background:#10b981;"></div> <b>Penyeberangan</b></div>
        <div class="legend-item" style="margin-left:auto;"><span style="color:#00e5ff;">✨ Fitur Interaktif:</span> <i>Arahkan kursor (Hover) di atas titik pelabuhan untuk memunculkan garis rute pelayaran</i></div>
    </div>
""", unsafe_allow_html=True)


# ==============================================================================
# 5. GENERATOR PETA SATELIT LEAFLET INTERAKTIF (HOVER ROUTE VISIBILITY)
# ==============================================================================
def render_interactive_satellite_leaflet(df_ports, always_show_all_arcs=False):
    ports_json = df_ports.to_json(orient="records")
    
    html_code = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <title>Peta Satelit Indonesia Interaktif</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
            html, body, #map {{
                width: 100%;
                height: 100%;
                margin: 0;
                padding: 0;
                background-color: #050b14;
            }}
            .custom-tooltip {{
                background: rgba(15, 23, 42, 0.94) !important;
                border: 1px solid rgba(56, 189, 248, 0.4) !important;
                border-radius: 10px !important;
                color: #ffffff !important;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.6) !important;
                padding: 10px 14px !important;
                font-family: 'Segoe UI', Roboto, sans-serif !important;
            }}
            .leaflet-container {{
                background: #050b14 !important;
            }}
            /* Glow animation for central hub */
            .hub-pulse {{
                border-radius: 50%;
                box-shadow: 0 0 0 rgba(244, 63, 94, 0.8);
                animation: pulse 1.8s infinite;
            }}
            @keyframes pulse {{
                0% {{ box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.8); }}
                70% {{ box-shadow: 0 0 0 14px rgba(244, 63, 94, 0); }}
                100% {{ box-shadow: 0 0 0 0 rgba(244, 63, 94, 0); }}
            }}
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script>
            // Data Pelabuhan
            const portsData = {ports_json};
            const ALWAYS_SHOW_ALL = {"true" if always_show_all_arcs else "false"};
            
            // Inisialisasi Peta Leaflet berpusat di Indonesia (Lat -2.5, Lon 118.0)
            const map = L.map('map', {{
                center: [-2.5, 118.0],
                zoom: 5,
                zoomControl: true,
                attributionControl: false
            }});
            
            // 1. Layer Peta Satelit Asli Indonesia (Esri World Imagery) - Tampilan Satelit Sama Persis dengan Foto
            const satelliteTiles = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{{z}}/{{y}}/{{x}}', {{
                maxZoom: 18,
                attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            }}).addTo(map);
            
            // 2. Layer Label Nama Negara & Kota (Esri Reference Labels)
            const labelsTiles = L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{{z}}/{{y}}/{{x}}', {{
                maxZoom: 18,
                opacity: 0.85
            }}).addTo(map);
            
            const HUB_LAT = {HUB_LAT};
            const HUB_LON = {HUB_LON};
            
            // Simpan referensi garis arc dan marker
            const arcLinesMap = {{}};
            
            // Fungsi menghitung titik-titik kurva Arc 3D (Quadratic Bezier Curve)
            function getArcPoints(lat1, lon1, lat2, lon2, numPoints = 60) {{
                const points = [];
                const midLat = (lat1 + lat2) / 2;
                const midLon = (lon1 + lon2) / 2;
                
                // Menentukan kelengkungan garis arc berdasarkan jarak
                const dist = Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lon2 - lon1, 2));
                const curvature = Math.min(Math.max(dist * 0.25, 0.8), 4.5);
                
                // Perpendicular vector for arc height offset
                const controlLat = midLat + curvature * Math.cos(Math.atan2(lat2 - lat1, lon2 - lon1));
                const controlLon = midLon - curvature * Math.sin(Math.atan2(lat2 - lat1, lon2 - lon1));
                
                for (let i = 0; i <= numPoints; i++) {{
                    const t = i / numPoints;
                    const lat = (1 - t) * (1 - t) * lat1 + 2 * (1 - t) * t * controlLat + t * t * lat2;
                    const lon = (1 - t) * (1 - t) * lon1 + 2 * (1 - t) * t * controlLon + t * t * lon2;
                    points.push([lat, lon]);
                }}
                return points;
            }}
            
            // Buat Garis Arc Rute untuk setiap Pelabuhan Tujuan
            portsData.forEach(port => {{
                if (port.nama_pelabuhan !== "{HUB_NAME}") {{
                    const arcCoords = getArcPoints(HUB_LAT, HUB_LON, port.latitude, port.longitude);
                    
                    const polyline = L.polyline(arcCoords, {{
                        color: '#00e5ff',
                        weight: 3.5,
                        opacity: ALWAYS_SHOW_ALL ? 0.75 : 0, // 0 secara default, 1 saat hover
                        smoothFactor: 1,
                        dashArray: '8, 6',
                        lineCap: 'round'
                    }}).addTo(map);
                    
                    arcLinesMap[port.nama_pelabuhan] = polyline;
                }}
            }});
            
            // Buat Marker untuk Seluruh Pelabuhan
            portsData.forEach(port => {{
                const isHub = port.tipe_pelabuhan === 'Central Hub';
                const radius = isHub ? 11 : (port.tipe_pelabuhan === 'Hub' ? 8 : 6);
                
                const marker = L.circleMarker([port.latitude, port.longitude], {{
                    radius: radius,
                    fillColor: port.color_hex,
                    color: '#ffffff',
                    weight: isHub ? 3 : 1.5,
                    opacity: 1,
                    fillOpacity: 0.95
                }}).addTo(map);
                
                // Tooltip Content
                const tooltipContent = `
                    <div style="font-size:14px; font-weight:700; color:#38bdf8; margin-bottom:2px;">
                        ⚓ ${{port.nama_pelabuhan}}
                    </div>
                    <div style="font-size:12px; color:#94a3b8; margin-bottom:6px;">
                        📍 ${{port.kota_provinsi}} (${{port.kategori_wilayah}})
                    </div>
                    <div style="border-top:1px solid rgba(255,255,255,0.15); margin:6px 0;"></div>
                    <div style="font-size:12px; color:#e2e8f0;">
                        Tipe: <b>${{port.tipe_pelabuhan}}</b>
                    </div>
                    <div style="font-size:13px; font-weight:600; color:#f59e0b; margin-top:4px;">
                        📏 Jarak dari Tanjung Perak: <b>${{port.jarak_nm}} NM</b>
                    </div>
                `;
                
                marker.bindTooltip(tooltipContent, {{
                    className: 'custom-tooltip',
                    direction: 'top',
                    offset: [0, -10],
                    opacity: 0.95
                }});
                
                // Event Hover Cursor di Atas Marker Pelabuhan
                marker.on('mouseover', function(e) {{
                    this.setStyle({{ radius: radius + 4, weight: 4, color: '#f59e0b' }});
                    
                    // TAMPILKAN GARIS RUTE HOVER DARI TANJUNG PERAK KE PELABUHAN TERSEBUT
                    if (arcLinesMap[port.nama_pelabuhan]) {{
                        arcLinesMap[port.nama_pelabuhan].setStyle({{
                            opacity: 1,
                            weight: 4.5,
                            color: '#f59e0b',
                            dashArray: null
                        }});
                        arcLinesMap[port.nama_pelabuhan].bringToFront();
                    }}
                }});
                
                marker.on('mouseout', function(e) {{
                    this.setStyle({{ radius: radius, weight: isHub ? 3 : 1.5, color: '#ffffff' }});
                    
                    // SEMBUNYIKAN KEMBALI GARIS RUTE SAAT KURSOR KELUAR
                    if (arcLinesMap[port.nama_pelabuhan]) {{
                        arcLinesMap[port.nama_pelabuhan].setStyle({{
                            opacity: ALWAYS_SHOW_ALL ? 0.75 : 0,
                            weight: 3.5,
                            color: '#00e5ff',
                            dashArray: '8, 6'
                        }});
                    }}
                }});
            }});
        </script>
    </body>
    </html>
    """
    return html_code

# Display Maps
if map_engine == "Peta Satelit Indonesia Interaktif (Rekomendasi)":
    is_always_show = (route_visibility_mode == "Tampilkan Semua Garis Rute")
    satellite_html = render_interactive_satellite_leaflet(filtered_df, always_show_all_arcs=is_always_show)
    components.html(satellite_html, height=580, scrolling=False)

else:
    # PyDeck Map Mode with Satellite TileLayer Basemap
    layers = []
    
    # Esri Satellite TileLayer for Pydeck
    satellite_tile_layer = pdk.Layer(
        "TileLayer",
        data="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        min_zoom=0,
        max_zoom=19,
        tile_size=256
    )
    layers.append(satellite_tile_layer)
    
    # ArcLayer
    if not df_destinations.empty:
        arc_layer = pdk.Layer(
            "ArcLayer",
            data=df_destinations,
            get_source_position=["hub_lon", "hub_lat"],
            get_target_position=["longitude", "latitude"],
            get_source_color=[0, 229, 255, 180],
            get_target_color=[245, 158, 11, 230],
            get_stroke_width=3.2,
            great_circle=True,
            pickable=True,
            auto_highlight=True
        )
        layers.append(arc_layer)
        
    # ScatterplotLayer
    scatter_layer = pdk.Layer(
        "ScatterplotLayer",
        data=filtered_df,
        get_position=["longitude", "latitude"],
        get_fill_color="color_rgba",
        get_radius="radius_m",
        radius_scale=1,
        radius_min_pixels=6,
        radius_max_pixels=24,
        pickable=True,
        auto_highlight=True
    )
    layers.append(scatter_layer)
    
    view_state = pdk.ViewState(
        latitude=-2.5,
        longitude=118.0,
        zoom=4.6,
        pitch=pitch_angle,
        bearing=0
    )
    
    tooltip_html = {
        "html": """
        <div style="font-family: 'Segoe UI', sans-serif; padding: 10px 14px; background: rgba(15, 23, 42, 0.92); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 8px; color: #fff;">
            <div style="font-weight: 700; color: #38bdf8; font-size: 14px;">⚓ {nama_pelabuhan}</div>
            <div style="font-size: 12px; color: #94a3b8;">📍 {kota_provinsi}</div>
            <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 6px 0;">
            <div style="font-size: 12px;">Tipe: <b>{tipe_pelabuhan}</b></div>
            <div style="font-size: 13px; font-weight: 600; color: #f59e0b; margin-top: 4px;">
                📏 Jarak dari Tanjung Perak: <b>{jarak_nm} NM</b>
            </div>
        </div>
        """,
        "style": {"backgroundColor": "transparent", "zIndex": "1000"}
    }
    
    deck = pdk.Deck(
        layers=layers,
        initial_view_state=view_state,
        map_style=None,
        tooltip=tooltip_html
    )
    
    st.pydeck_chart(deck, use_container_width=True)


# ==============================================================================
# 6. TABEL DATA PELABUHAN INTERAKTIF
# ==============================================================================
st.markdown("### 📊 Tabel Data Pelabuhan & Jarak Pelayaran")

if not filtered_df.empty:
    df_display = filtered_df[[
        "nama_pelabuhan", "kota_provinsi", "kategori_wilayah", 
        "tipe_pelabuhan", "latitude", "longitude", "jarak_nm"
    ]].copy()
    
    df_display.rename(columns={
        "nama_pelabuhan": "Nama Pelabuhan",
        "kota_provinsi": "Kota / Provinsi",
        "kategori_wilayah": "Wilayah",
        "tipe_pelabuhan": "Tipe",
        "latitude": "Latitude",
        "longitude": "Longitude",
        "jarak_nm": "Jarak dari Tanjung Perak (NM)"
    }, inplace=True)
    
    df_display = df_display.sort_values(by="Jarak dari Tanjung Perak (NM)")

    st.dataframe(
        df_display,
        use_container_width=True,
        hide_index=True,
        column_config={
            "Jarak dari Tanjung Perak (NM)": st.column_config.NumberColumn(
                "Jarak dari Tanjung Perak (NM)",
                format="%.2f NM",
                help="Jarak estimasi pelayaran garis lurus (Haversine) dalam Nautical Miles"
            ),
            "Latitude": st.column_config.NumberColumn(format="%.4f"),
            "Longitude": st.column_config.NumberColumn(format="%.4f"),
        }
    )
    
    csv_data = df_display.to_csv(index=False).encode('utf-8')
    st.download_button(
        label="📥 Download Data Pelabuhan (CSV)",
        data=csv_data,
        file_name="data_pelabuhan_indonesia_tanjung_perak.csv",
        mime="text/csv"
    )
else:
    st.warning("⚠️ Tidak ada pelabuhan yang memenuhi kriteria filter yang dipilih.")

# Footer
st.markdown("---")
st.markdown("""
    <div style="text-align: center; color: #64748b; font-size: 0.85rem;">
        Peta Jaringan Pelayaran Indonesia &copy; 2026 | Built with Streamlit, Leaflet & PyDeck | Central Hub: Pelabuhan Tanjung Perak (-7.1992, 112.7378)
    </div>
""", unsafe_allow_html=True)
