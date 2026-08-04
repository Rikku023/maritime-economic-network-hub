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

export type StatusProfitability =
  | 'High Profit'
  | 'Balanced'
  | 'Low Profit / High Imbalance';

export interface Port {
  id: string;
  nama_pelabuhan: string;
  lokasi: string;
  wilayah: Wilayah;
  jenis: JenisPelabuhan;
  latitude: number;
  longitude: number;
  jarak_nm?: number;
  total_bongkar_ton?: number;
  total_muat_ton?: number;
  trip_count?: number;
  imbalance_ratio?: number;
  port_stay_hours?: number;
  est_fuel_cost_idr?: number;
  est_port_cost_idr?: number;
  gravity_score?: number;
  status_profitability?: StatusProfitability;
}

export interface FilterState {
  wilayah: Wilayah[];
  jenis: JenisPelabuhan[];
  statusProfitability: StatusProfitability[];
  searchQuery: string;
  hoverMode: boolean;
}
