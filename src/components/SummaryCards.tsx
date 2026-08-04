'use client';

import React from 'react';
import { Port } from '@/types/port';
import { formatDistance } from '@/lib/utils';
import { Ship, Navigation, Compass, BarChart3 } from 'lucide-react';

interface SummaryCardsProps {
  ports: Port[];
  totalPortsCount: number;
}

export default function SummaryCards({ ports, totalPortsCount }: SummaryCardsProps) {
  // Exclude Tanjung Perak central hub from route distance extremes
  const destinations = ports.filter((p) => p.jenis !== 'Central Hub');

  const furthestPort = destinations.length
    ? destinations.reduce((prev, curr) =>
        (curr.jarak_nm || 0) > (prev.jarak_nm || 0) ? curr : prev
      )
    : null;

  const closestPort = destinations.length
    ? destinations.reduce((prev, curr) =>
        (curr.jarak_nm || 0) < (prev.jarak_nm || 0) ? curr : prev
      )
    : null;

  const avgDistance = destinations.length
    ? destinations.reduce((sum, p) => sum + (p.jarak_nm || 0), 0) /
      destinations.length
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Metric 1: Total Ports */}
      <div className="bg-slate-900/80 border border-sky-500/20 rounded-2xl p-5 shadow-lg shadow-black/40 backdrop-blur-md hover:border-sky-500/40 transition-all group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Pelabuhan Terkoneksi
          </span>
          <div className="p-2 bg-sky-500/10 rounded-xl border border-sky-500/20 text-sky-400 group-hover:scale-110 transition-transform">
            <Ship className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl lg:text-3xl font-extrabold text-white mb-1">
          {ports.length}{' '}
          <span className="text-xs font-normal text-slate-400">
            / {totalPortsCount} Total
          </span>
        </div>
        <p className="text-xs text-sky-400 font-medium flex items-center gap-1">
          <span>Central Hub:</span> Pelabuhan Tanjung Perak
        </p>
      </div>

      {/* Metric 2: Rute Terjauh */}
      <div className="bg-slate-900/80 border border-sky-500/20 rounded-2xl p-5 shadow-lg shadow-black/40 backdrop-blur-md hover:border-sky-500/40 transition-all group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Rute Terjauh (NM)
          </span>
          <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform">
            <Navigation className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl lg:text-3xl font-extrabold text-white mb-1">
          {furthestPort ? formatDistance(furthestPort.jarak_nm) : '-'}
        </div>
        <p className="text-xs text-amber-400 font-medium truncate">
          {furthestPort
            ? `${furthestPort.nama_pelabuhan} (${furthestPort.wilayah})`
            : 'Tidak ada data'}
        </p>
      </div>

      {/* Metric 3: Rute Terdekat */}
      <div className="bg-slate-900/80 border border-sky-500/20 rounded-2xl p-5 shadow-lg shadow-black/40 backdrop-blur-md hover:border-sky-500/40 transition-all group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Rute Terdekat (NM)
          </span>
          <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
            <Compass className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl lg:text-3xl font-extrabold text-white mb-1">
          {closestPort ? formatDistance(closestPort.jarak_nm) : '-'}
        </div>
        <p className="text-xs text-emerald-400 font-medium truncate">
          {closestPort
            ? `${closestPort.nama_pelabuhan} (${closestPort.wilayah})`
            : 'Tidak ada data'}
        </p>
      </div>

      {/* Metric 4: Rata-Rata Jarak */}
      <div className="bg-slate-900/80 border border-sky-500/20 rounded-2xl p-5 shadow-lg shadow-black/40 backdrop-blur-md hover:border-sky-500/40 transition-all group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Rata-Rata Jarak Rute
          </span>
          <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform">
            <BarChart3 className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl lg:text-3xl font-extrabold text-white mb-1">
          {formatDistance(avgDistance)}
        </div>
        <p className="text-xs text-cyan-400 font-medium">
          Rata-rata jarak jaringan laut
        </p>
      </div>
    </div>
  );
}
