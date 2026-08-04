import { NextRequest, NextResponse } from 'next/server';
import { PORTS_DATA } from '@/data/ports';
import { enrichPortsWithDistance, TANJUNG_PERAK_HUB } from '@/lib/distance';
import { Wilayah, JenisPelabuhan } from '@/types/port';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Read query parameters
    const wilayahParam = searchParams.get('wilayah');
    const jenisParam = searchParams.get('jenis');
    const searchParam = searchParams.get('search');

    // Enrich dataset with distance in NM
    let ports = enrichPortsWithDistance(PORTS_DATA);

    // Filter by Wilayah (comma-separated or single)
    if (wilayahParam) {
      const allowedWilayah = wilayahParam.split(',') as Wilayah[];
      ports = ports.filter((p) => allowedWilayah.includes(p.wilayah));
    }

    // Filter by Jenis (comma-separated or single)
    if (jenisParam) {
      const allowedJenis = jenisParam.split(',') as JenisPelabuhan[];
      ports = ports.filter((p) => allowedJenis.includes(p.jenis));
    }

    // Filter by Search Query (Nama or Lokasi)
    if (searchParam) {
      const query = searchParam.toLowerCase().trim();
      ports = ports.filter(
        (p) =>
          p.nama_pelabuhan.toLowerCase().includes(query) ||
          p.lokasi.toLowerCase().includes(query)
      );
    }

    return NextResponse.json({
      success: true,
      hub: {
        ...TANJUNG_PERAK_HUB,
        jarak_nm: 0,
      },
      total: ports.length,
      data: ports,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to retrieve ports dataset',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
