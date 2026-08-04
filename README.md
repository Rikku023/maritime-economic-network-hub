# 🚢 Maritime Economic Network Hub - Tanjung Perak Surabaya

Aplikasi Web Full-Stack interaktif untuk visualisasi 3D jaringan rute pelayaran di Indonesia berpusat di **Pelabuhan Tanjung Perak (Surabaya)** sebagai *Central Hub*. Dibangun menggunakan **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Deck.gl**, dan **MapLibre GL**.

![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)
![Deck.gl](https://img.shields.io/badge/Deck.gl-9.0-green)
![Vercel](https://img.shields.io/badge/Deployment-Vercel-black?logo=vercel)

---

## ✨ Fitur Utama

- **Dataset 60 Pelabuhan Utama Nusantara**: Berisi data terstruktur 60 pelabuhan yang mencakup wilayah Jawa, Sumatra, Kalimantan, Sulawesi, Bali-Nusra, dan Maluku-Papua.
- **Central Hub Tanjung Perak**: Ditetapkan di koordinat `[-7.19667, 112.73278]` (Surabaya, Jawa Timur).
- **Kalkulasi Jarak Haversine (NM)**: Perhitungan jarak laut otomatis dalam satuan *Nautical Miles* (1 NM = 1.852 KM).
- **Visualisasi Peta 3D (Deck.gl + MapLibre GL)**:
  - `ArcLayer` 3D: Garis lengkung 3D berkilau dari Tanjung Perak ke pelabuhan tujuan.
  - `ScatterplotLayer`: Marker pelabuhan berwarna neon (Crimson untuk Central Hub, Gold untuk Hub Utama, Cyan untuk Feeder, Green untuk Penyeberangan).
  - **Hover Mode Interaktif**: Garis rute pelayaran hanya muncul saat kursor diarahkan (*hover*) di atas titik pelabuhan.
  - Interactive Floating Tooltip.
- **Sidebar Filter & Search**: Filter multi-select wilayah, tipe pelabuhan, pencarian nama/kota, dan toggle mode rute.
- **Metric Cards & Data Table**: Ringkasan metrik real-time dan tabel data interaktif dengan sortasi kolom serta opsi ekspor CSV.
- **Backend API Route (`/api/ports`)**: Endpoint REST API Next.js dengan dukungan query parameter filtering (`?wilayah=...&jenis=...&search=...`).

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Bahasa**: TypeScript (Strict type checking)
- **Styling**: Tailwind CSS + Lucide React Icons
- **Visualisasi Peta**: Deck.gl (`@deck.gl/react`, `@deck.gl/layers`) + MapLibre GL
- **Deployment Target**: Vercel Zero-Config

---

## 📂 Struktur Proyek

```text
.
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── ports/
│   │   │       └── route.ts        # Next.js API Route /api/ports
│   │   ├── globals.css             # Styling Tailwind CSS & Dark theme
│   │   ├── layout.tsx              # Root Layout Metadata
│   │   └── page.tsx                # Halaman Utama Dashboard
│   ├── components/
│   │   ├── Map.tsx                 # Komponen Peta 3D Deck.gl + MapLibre
│   │   ├── Navbar.tsx              # Header / Navbar Utama
│   │   ├── PortTable.tsx           # Tabel Data Pelabuhan & Ekspor CSV
│   │   ├── Sidebar.tsx             # Sidebar Filter & Search
│   │   └── SummaryCards.tsx        # Card Metrik Ringkasan (Total, Terjauh, Terdekat)
│   ├── data/
│   │   └── ports.ts                # Dataset 60 Pelabuhan Utama Indonesia
│   ├── lib/
│   │   ├── distance.ts             # Formula Haversine Distance (NM)
│   │   └── utils.ts                # Helper Utilities & Classnames
│   └── types/
│       └── port.ts                 # TypeScript Interfaces & Types
├── public/                         # Static Assets
├── next.config.js                  # Konfigurasi Next.js
├── tailwind.config.ts              # Konfigurasi Tailwind CSS
├── tsconfig.json                   # Konfigurasi TypeScript
├── package.json                    # Package Dependencies
└── README.md                       # Dokumentasi Proyek
```

---

## 🚀 Panduan Instalasi & Pengembangan Lokal

### 1. Prasyarat
- Node.js v18.0.0 atau lebih baru
- npm / pnpm / yarn

### 2. Jalankan Secara Lokal

```bash
# Clone repository ini (jika dari GitHub)
git clone https://github.com/USERNAME/maritime-economic-network-hub.git
cd maritime-economic-network-hub

# Install dependencies
npm install

# Jalankan server pengembangan lokal
npm run dev
```

Buka browser di `http://localhost:3000`.

### 3. Uji Build Produksi (Strict TypeScript Check)

```bash
npm run build
```

---

## 📤 Panduan Push ke GitHub Repository

1. **Inisialisasi Repositori Git**:
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit maritime economic network hub fullstack next.js"
   ```

2. **Hubungkan ke GitHub Remote Repository**:
   ```bash
   git branch -M main
   git remote add origin https://github.com/USERNAME/maritime-economic-network-hub.git
   git push -u origin main
   ```

---

## 🌐 Panduan Deployment ke Vercel

1. Buka [Vercel Dashboard](https://vercel.com/dashboard) dan klik **Add New Project**.
2. Impor repositori GitHub `maritime-economic-network-hub`.
3. Vercel akan secara otomatis mendeteksi Framework **Next.js**.
4. Klik **Deploy** (Tanpa perlu konfigurasi tambahan / Zero Config).
5. Aplikasi akan langsung tayang di URL produksi Vercel (`https://maritime-economic-network-hub.vercel.app`).

---

## 🌐 API Endpoint Reference

### `GET /api/ports`
Mengembalikan daftar pelabuhan beserta jarak NM terhitung dari Pelabuhan Tanjung Perak.

**Query Parameters (Opsional)**:
- `wilayah`: Filter wilayah (contoh: `Jawa,Sumatra,Kalimantan`)
- `jenis`: Filter jenis pelabuhan (contoh: `Hub Utama,Feeder`)
- `search`: Kata kunci pencarian (contoh: `Semarang`)

**Contoh Response JSON**:
```json
{
  "success": true,
  "hub": {
    "id": "hub-surabaya",
    "nama_pelabuhan": "Pelabuhan Tanjung Perak",
    "lokasi": "Surabaya, Jawa Timur",
    "wilayah": "Jawa",
    "jenis": "Central Hub",
    "latitude": -7.19667,
    "longitude": 112.73278,
    "jarak_nm": 0
  },
  "total": 60,
  "data": [
    {
      "id": "port-jawa-02",
      "nama_pelabuhan": "Pelabuhan Tanjung Priok",
      "lokasi": "Jakarta Utara, DKI Jakarta",
      "wilayah": "Jawa",
      "jenis": "Hub Utama",
      "latitude": -6.1011,
      "longitude": 106.8837,
      "jarak_nm": 352.48
    }
  ]
}
```

---

License: MIT &copy; 2026 Maritime Economic Network Hub
