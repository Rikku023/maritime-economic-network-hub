'use client';

import React, { useState, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer, ArcLayer, ScatterplotLayer } from '@deck.gl/layers';
import { Map } from 'react-map-gl/maplibre';
import { Port } from '@/types/port';
import { TANJUNG_PERAK_HUB, calculateHaversineNM } from '@/lib/distance';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapProps {
  ports: Port[];
  hoverMode: boolean;
}

const INITIAL_VIEW_STATE = {
  longitude: 118.0,
  latitude: -2.5,
  zoom: 4.8,
  pitch: 42,
  bearing: 0,
};

const INDONESIA_GEOJSON_URL =
  'https://raw.githubusercontent.com/superpika/indonesia-geojson/master/indonesia.geojson';

const CARTO_DARK_MAP_STYLE =
  'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

export default function MapComponent({ ports, hoverMode }: MapProps) {
  const [hoveredPort, setHoveredPort] = useState<Port | null>(null);

  const getPortColor = (jenis: string): [number, number, number, number] => {
    switch (jenis) {
      case 'Central Hub':
        return [244, 63, 94, 255]; // Neon Crimson / Rose
      case 'Hub Utama':
        return [245, 158, 11, 240]; // Amber Gold
      case 'Feeder':
        return [0, 229, 255, 220]; // Neon Cyan
      case 'Penyeberangan':
        return [16, 185, 129, 220]; // Emerald Green
      default:
        return [56, 189, 248, 200];
    }
  };

  const getPortRadius = (jenis: string): number => {
    switch (jenis) {
      case 'Central Hub':
        return 32000;
      case 'Hub Utama':
        return 22000;
      case 'Feeder':
        return 14000;
      case 'Penyeberangan':
        return 12000;
      default:
        return 10000;
    }
  };

  // 3D Arc Color based on Route Profitability Status
  const getArcColor = (status?: string): [number, number, number, number] => {
    switch (status) {
      case 'High Profit':
        return [0, 255, 128, 240]; // Hijau Neon
      case 'Balanced':
        return [0, 245, 255, 220]; // Cyan Neon
      case 'Low Profit / High Imbalance':
        return [255, 99, 132, 240]; // Merah/Kuning Neon
      default:
        return [0, 245, 255, 220];
    }
  };

  const arcData = useMemo(() => {
    const destinations = ports.filter(
      (p) => p.nama_pelabuhan !== TANJUNG_PERAK_HUB.nama_pelabuhan
    );

    if (hoverMode) {
      if (!hoveredPort || hoveredPort.nama_pelabuhan === TANJUNG_PERAK_HUB.nama_pelabuhan) {
        return [];
      }
      return destinations.filter((p) => p.id === hoveredPort.id);
    }

    return destinations;
  }, [ports, hoverMode, hoveredPort]);

  const layers = [
    // 1. GEOJSON INDONESIA NEON RADAR LAYER
    new GeoJsonLayer({
      id: 'indonesia-geojson-neon',
      data: INDONESIA_GEOJSON_URL,
      filled: true,
      stroked: true,
      getFillColor: [15, 23, 42, 180],
      getLineColor: [0, 245, 255, 220],
      getLineWidth: 1.5,
      lineWidthUnits: 'pixels',
      pickable: false,
    }),

    // 2. ARC LAYER 3D (Warna sesuai Status Profitability)
    new ArcLayer({
      id: 'arc-layer',
      data: arcData,
      getSourcePosition: () => [
        TANJUNG_PERAK_HUB.longitude,
        TANJUNG_PERAK_HUB.latitude,
      ],
      getTargetPosition: (d: Port) => [d.longitude, d.latitude],
      getSourceColor: [0, 245, 255, 180],
      getTargetColor: (d: Port) => getArcColor(d.status_profitability),
      getWidth: 3.8,
      greatCircle: true,
      pickable: true,
    }),

    // 3. SCATTERPLOT MARKER LAYER
    new ScatterplotLayer({
      id: 'scatterplot-layer',
      data: ports,
      getPosition: (d: Port) => [d.longitude, d.latitude],
      getFillColor: (d: Port) => getPortColor(d.jenis),
      getRadius: (d: Port) => getPortRadius(d.jenis),
      radiusScale: 1,
      radiusMinPixels: 6,
      radiusMaxPixels: 24,
      pickable: true,
      autoHighlight: true,
      onHover: (info) => {
        if (info.object) {
          setHoveredPort(info.object as Port);
        } else {
          setHoveredPort(null);
        }
      },
    }),
  ];

  return (
    <div className="relative w-full h-[580px] rounded-2xl overflow-hidden border border-sky-500/20 shadow-2xl bg-slate-950">
      {/* Map Legend Overlay */}
      <div className="absolute top-3 left-3 z-10 bg-slate-950/90 border border-sky-500/30 backdrop-blur-md rounded-xl px-4 py-2.5 flex flex-col gap-2 text-xs shadow-xl">
        <div className="flex items-center gap-3 font-bold text-slate-200 border-b border-slate-800 pb-1.5">
          <span className="text-slate-300">Tipe Pelabuhan:</span>
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1.5 font-medium text-rose-300">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e] inline-block shadow-sm"></span> Hub
            </span>
            <span className="flex items-center gap-1.5 font-medium text-amber-300">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] inline-block shadow-sm"></span> Utama
            </span>
            <span className="flex items-center gap-1.5 font-medium text-cyan-300">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00e5ff] inline-block shadow-sm"></span> Feeder
            </span>
            <span className="flex items-center gap-1.5 font-medium text-emerald-300">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] inline-block shadow-sm"></span> Penyeberangan
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-300 font-medium">
          <span className="text-slate-400">Profitabilitas Rute:</span>
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00ff80] inline-block shadow-sm"></span> High Profit
            </span>
            <span className="flex items-center gap-1.5 text-cyan-300 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00f5ff] inline-block shadow-sm"></span> Balanced
            </span>
            <span className="flex items-center gap-1.5 text-rose-300 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff6384] inline-block shadow-sm"></span> Low Profit
            </span>
          </div>
        </div>
      </div>

      {/* DeckGL Canvas */}
      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        layers={layers}
        style={{ position: 'relative', width: '100%', height: '100%' }}
      >
        <Map mapStyle={CARTO_DARK_MAP_STYLE} />
      </DeckGL>

      {/* Interactive Tooltip Peta */}
      {hoveredPort && (
        <div
          className="absolute z-20 pointer-events-none bg-slate-950/95 border border-sky-500/40 rounded-xl p-4 shadow-2xl backdrop-blur-md text-white min-w-[270px] max-w-xs"
          style={{
            bottom: '24px',
            left: '24px',
          }}
        >
          <div className="text-sm font-bold text-sky-400 flex items-center gap-1.5 mb-0.5">
            ⚓ {hoveredPort.nama_pelabuhan}
          </div>
          <div className="text-xs text-slate-400 mb-2">
            📍 {hoveredPort.lokasi} ({hoveredPort.wilayah})
          </div>

          <div className="h-px bg-slate-800 my-2"></div>

          {/* Econometric Metrics Details */}
          <div className="space-y-1.5 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Tipe Pelabuhan:</span>
              <span className="font-semibold text-slate-200">{hoveredPort.jenis}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-slate-400">Jarak dari Perak:</span>
              <span className="font-semibold text-amber-400">
                {hoveredPort.jarak_nm !== undefined
                  ? `${hoveredPort.jarak_nm.toLocaleString('id-ID')} NM`
                  : `${calculateHaversineNM(
                      TANJUNG_PERAK_HUB.latitude,
                      TANJUNG_PERAK_HUB.longitude,
                      hoveredPort.latitude,
                      hoveredPort.longitude
                    )} NM`}
              </span>
            </div>

            {/* Volume Supply vs Demand */}
            <div className="flex justify-between">
              <span className="text-slate-400">Vol. Supply vs Demand:</span>
              <span className="font-medium text-cyan-300">
                S: {((hoveredPort.net_supply_ton || hoveredPort.total_muat_ton || 0) / 1000).toLocaleString('id-ID', { maximumFractionDigits: 0 })}k | D: {((hoveredPort.net_demand_ton || hoveredPort.total_bongkar_ton || 0) / 1000).toLocaleString('id-ID', { maximumFractionDigits: 0 })}k Ton
              </span>
            </div>

            {/* Imbalance Ratio */}
            <div className="flex justify-between">
              <span className="text-slate-400">Imbalance Ratio (TIR):</span>
              <span className="font-semibold text-emerald-400">
                {hoveredPort.imbalance_ratio?.toFixed(2)}x
              </span>
            </div>

            {/* Est. Voyage Cost */}
            <div className="flex justify-between">
              <span className="text-slate-400">Est. Voyage Cost:</span>
              <span className="font-semibold text-slate-100">
                Rp {(((hoveredPort.est_voyage_cost_idr || ((hoveredPort.est_fuel_cost_idr || 0) + (hoveredPort.est_port_cost_idr || 0)))) / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Jt
              </span>
            </div>

            {/* Struktur Pasar HHI */}
            {hoveredPort.hhi_market_status && (
              <div className="flex justify-between">
                <span className="text-slate-400">Struktur Pasar (HHI):</span>
                <span className="font-medium text-purple-300">
                  {hoveredPort.hhi_market_status}
                </span>
              </div>
            )}
          </div>

          {/* Status Profitabilitas Badge */}
          {hoveredPort.status_profitability && (
            <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Status Profitabilitas:</span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                  hoveredPort.status_profitability === 'High Profit'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : hoveredPort.status_profitability === 'Balanced'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                }`}
              >
                {hoveredPort.status_profitability}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
