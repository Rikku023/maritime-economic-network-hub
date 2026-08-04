export type Wilayah = 
  | 'Jawa' 
  | 'Sumatra' 
  | 'Kalimantan' 
  | 'Sulawesi' 
  | 'Bali-Nusra' 
  | 'Maluku-Papua';

export type JenisPelabuhan = 
  | 'Central Hub' 
  | 'Hub Utama' 
  | 'Feeder' 
  | 'Penyeberangan';

export interface Port {
  id: string;
  nama_pelabuhan: string;
  lokasi: string;
  wilayah: Wilayah;
  jenis: JenisPelabuhan;
  latitude: number;
  longitude: number;
  jarak_nm?: number;
}

export interface FilterState {
  wilayah: Wilayah[];
  jenis: JenisPelabuhan[];
  searchQuery: string;
  hoverMode: boolean;
}

export interface PortSummaryMetrics {
  totalPorts: number;
  furthestPort: {
    nama: string;
    jarak: number;
    wilayah: string;
  } | null;
  closestPort: {
    nama: string;
    jarak: number;
    wilayah: string;
  } | null;
  averageDistance: number;
}
