import { Port } from '@/types/port';

export const TANJUNG_PERAK_HUB = {
  id: 'port-jawa-55',
  nama_pelabuhan: 'Pelabuhan Tanjung Perak',
  lokasi: 'Surabaya, Jawa Timur',
  wilayah: 'Jawa' as const,
  jenis: 'Central Hub' as const,
  latitude: -7.2,
  longitude: 112.7333,
};

/**
 * Calculates Great Circle Distance between two coordinates in Nautical Miles (NM).
 * 1 Nautical Mile = 1.852 Kilometers.
 * Earth Radius R ≈ 3440.065 NM.
 */
export function calculateHaversineNM(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R_NM = 3440.065;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R_NM * c * 100) / 100;
}

/**
 * Enriches port records with distance in Nautical Miles from Pelabuhan Tanjung Perak.
 */
export function enrichPortsWithDistance(ports: Port[]): Port[] {
  return ports.map((port) => ({
    ...port,
    jarak_nm: calculateHaversineNM(
      TANJUNG_PERAK_HUB.latitude,
      TANJUNG_PERAK_HUB.longitude,
      port.latitude,
      port.longitude
    ),
  }));
}
