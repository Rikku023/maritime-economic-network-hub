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

// Initial Viewport centered over Indonesia
const INITIAL_VIEW_STATE = {
  longitude: 118.0,
  latitude: -2.5,
  zoom: 4.8,
  pitch: 42,
  bearing: 0,
};

// CDN GeoJSON Data Daratan Indonesia
const INDONESIA_GEOJSON_URL =
  'https://raw.githubusercontent.com/superpika/indonesia-geojson/master/indonesia.geojson';

// CartoDB Dark Matter Free Vector Tile Style JSON
const CARTO_DARK_MAP_STYLE =
  'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

export default function MapComponent({ ports, hoverMode }: MapProps) {
  const [hoveredPort, setHoveredPort] = useState<Port | null>(null);

  // Define Marker Colors [R, G, B, A]
  const getPortColor = (jenis: string): [number, number, number, number] => {
    switch (jenis) {
      case 'Central Hub':
        return [244, 63, 94, 255]; // Neon Crimson / Red
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

  // Define Marker Radius in Meters
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

  // Filter destination ports for ArcLayer
  const arcData = useMemo(() => {
    const destinations = ports.filter(
      (p) => p.nama_pelabuhan !== TANJUNG_PERAK_HUB.nama_pelabuhan
    );

    // If hover mode is enabled, only show arc for the hovered port
    if (hoverMode) {
      if (!hoveredPort || hoveredPort.nama_pelabuhan === TANJUNG_PERAK_HUB.nama_pelabuhan) {
        return [];
      }
      return destinations.filter((p) => p.id === hoveredPort.id);
    }

    return destinations;
  }, [ports, hoverMode, hoveredPort]);

  // Deck.gl Layers in Order: (1) GeoJsonLayer -> (2) ArcLayer -> (3) ScatterplotLayer
  const layers = [
    // 1. GEOJSON NEON RADAR LAYER (Indonesia Island Boundaries & Landmass)
    new GeoJsonLayer({
      id: 'indonesia-geojson-neon',
      data: INDONESIA_GEOJSON_URL,
      filled: true,
      stroked: true,
      getFillColor: [15, 23, 42, 180], // Slate-900 dengan transparansi
      getLineColor: [0, 245, 255, 220], // Neon Cyan berkilau
      getLineWidth: 1.5,
      lineWidthUnits: 'pixels',
      pickable: false,
    }),

    // 2. ARC LAYER (3D Route Lines from Tanjung Perak Hub)
    new ArcLayer({
      id: 'arc-layer',
      data: arcData,
      getSourcePosition: () => [
        TANJUNG_PERAK_HUB.longitude,
        TANJUNG_PERAK_HUB.latitude,
      ],
      getTargetPosition: (d: Port) => [d.longitude, d.latitude],
      getSourceColor: [0, 245, 255, 200], // Neon Cyan origin
      getTargetColor: [245, 158, 11, 240], // Neon Gold destination
      getWidth: 3.5,
      greatCircle: true,
      pickable: true,
    }),

    // 3. SCATTERPLOT LAYER (Port Marker Dots)
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
      {/* Map Top-Left Legend Overlay */}
      <div className="absolute top-3 left-3 z-10 bg-slate-950/85 border border-sky-500/20 backdrop-blur-md rounded-xl px-3.5 py-2 flex items-center gap-4 text-xs shadow-lg">
        <div className="flex items-center gap-1.5 text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500"></span>
          <span>Central Hub</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>Hub Utama</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
          <span>Feeder</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Penyeberangan</span>
        </div>
      </div>

      {/* Hover Mode Badge Overlay */}
      <div className="absolute top-3 right-3 z-10 bg-slate-950/85 border border-sky-500/20 backdrop-blur-md rounded-xl px-3 py-1.5 text-[11px] text-cyan-300 shadow-lg flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
        <span>{hoverMode ? '✨ Hover Mode: Aktif' : '🌐 Mode Semua Rute'}</span>
      </div>

      {/* DeckGL Canvas with CartoDB MapLibre Basemap */}
      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        layers={layers}
        style={{ position: 'relative', width: '100%', height: '100%' }}
      >
        <Map
          mapStyle={CARTO_DARK_MAP_STYLE}
        />
      </DeckGL>

      {/* Interactive Hover Tooltip */}
      {hoveredPort && (
        <div
          className="absolute z-20 pointer-events-none bg-slate-950/95 border border-sky-500/40 rounded-xl p-3.5 shadow-2xl backdrop-blur-md text-white max-w-xs"
          style={{
            bottom: '24px',
            left: '24px',
          }}
        >
          <div className="text-sm font-bold text-sky-400 flex items-center gap-1.5 mb-1">
            ⚓ {hoveredPort.nama_pelabuhan}
          </div>
          <div className="text-xs text-slate-400 mb-2">
            📍 {hoveredPort.lokasi} ({hoveredPort.wilayah})
          </div>
          <div className="h-px bg-slate-800 my-1.5"></div>
          <div className="text-xs text-slate-300 mb-1">
            Tipe Pelabuhan: <strong className="text-slate-100">{hoveredPort.jenis}</strong>
          </div>
          <div className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-md inline-block mt-1">
            📏 Jarak dari Tanjung Perak:{' '}
            {hoveredPort.jarak_nm !== undefined
              ? `${hoveredPort.jarak_nm.toLocaleString('id-ID')} NM`
              : `${calculateHaversineNM(
                  TANJUNG_PERAK_HUB.latitude,
                  TANJUNG_PERAK_HUB.longitude,
                  hoveredPort.latitude,
                  hoveredPort.longitude
                )} NM`}
          </div>
        </div>
      )}
    </div>
  );
}
