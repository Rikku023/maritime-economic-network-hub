import { NextRequest, NextResponse } from 'next/server';
import { PORTS_DATA } from '@/data/ports';
import { enrichPortsWithDistance, TANJUNG_PERAK_HUB } from '@/lib/distance';
import routesAnalyticsJson from '@/data/routes_analytics.json';
import { Wilayah, JenisPelabuhan, StatusProfitability, Port } from '@/types/port';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wilayahParam = searchParams.get('wilayah');
    const jenisParam = searchParams.get('jenis');
    const statusParam = searchParams.get('status');
    const searchParam = searchParams.get('search');

    // Build lookup map from analytics JSON
    const analyticsMap = new Map<string, any>();
    if (routesAnalyticsJson && Array.isArray(routesAnalyticsJson.routes)) {
      routesAnalyticsJson.routes.forEach((r: any) => {
        analyticsMap.set(r.id, r);
      });
    }

    // Merge ports_data with analytics
    let ports: Port[] = enrichPortsWithDistance(PORTS_DATA).map((port) => {
      const analytics = analyticsMap.get(port.id);
      if (analytics) {
        return {
          ...port,
          total_bongkar_ton: analytics.total_bongkar_ton,
          total_muat_ton: analytics.total_muat_ton,
          net_supply_ton: analytics.net_supply_ton,
          net_demand_ton: analytics.net_demand_ton,
          trip_count: analytics.trip_count,
          imbalance_ratio: analytics.imbalance_ratio,
          port_stay_hours: analytics.port_stay_hours,
          est_fuel_cost_idr: analytics.est_fuel_cost_idr,
          est_port_cost_idr: analytics.est_port_cost_idr,
          est_lubricant_cost_idr: analytics.est_lubricant_cost_idr,
          est_voyage_cost_idr: analytics.est_voyage_cost_idr,
          market_share_pct: analytics.market_share_pct,
          hhi_index: analytics.hhi_index,
          hhi_market_status: analytics.hhi_market_status,
          gravity_score: analytics.gravity_score,
          profitability_index: analytics.profitability_index,
          status_profitability: analytics.status_profitability as StatusProfitability,
        };
      }
      return port;
    });

    if (wilayahParam) {
      const allowedWilayah = wilayahParam.split(',') as Wilayah[];
      ports = ports.filter((p) => allowedWilayah.includes(p.wilayah));
    }

    if (jenisParam) {
      const allowedJenis = jenisParam.split(',') as JenisPelabuhan[];
      ports = ports.filter((p) => allowedJenis.includes(p.jenis));
    }

    if (statusParam) {
      const allowedStatus = statusParam.split(',') as StatusProfitability[];
      ports = ports.filter(
        (p) => p.status_profitability && allowedStatus.includes(p.status_profitability)
      );
    }

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
      metadata: routesAnalyticsJson.metadata || {},
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
