'use client';

import React from 'react';
import { Port } from '@/types/port';
import { Ship, TrendingUp, Scale, PackageCheck } from 'lucide-react';

interface SummaryCardsProps {
  ports: Port[];
  totalPortsCount: number;
}

export default function SummaryCards({ ports, totalPortsCount }: SummaryCardsProps) {
  // Exclude Tanjung Perak central hub for trade imbalance & destination metrics
  const destinations = ports.filter((p) => p.jenis !== 'Central Hub');

  // Count High Profit Routes
  const highProfitCount = destinations.filter(
    (p) => p.status_profitability === 'High Profit'
  ).length;

  // Average Trade Imbalance Ratio
  const validImbalancePorts = destinations.filter(
    (p) => p.imbalance_ratio !== undefined && p.imbalance_ratio !== null
  );
  const avgImbalance = validImbalancePorts.length
    ? validImbalancePorts.reduce((sum, p) => sum + (p.imbalance_ratio || 0), 0) /
      validImbalancePorts.length
    : 0;

  // Total Logistics Cargo Volume in Tons
  const totalCargoTon = ports.reduce(
    (sum, p) => sum + (p.total_bongkar_ton || 0) + (p.total_muat_ton || 0),
    0
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Metric 1: Total Pelabuhan Terkoneksi */}
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
          <span>Central Hub:</span> Tanjung Perak (Surabaya)
        </p>
      </div>

      {/* Metric 2: Rute Paling Menguntungkan */}
      <div className="bg-slate-900/80 border border-sky-500/20 rounded-2xl p-5 shadow-lg shadow-black/40 backdrop-blur-md hover:border-sky-500/40 transition-all group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Rute Paling Menguntungkan
          </span>
          <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl lg:text-3xl font-extrabold text-white mb-1">
          {highProfitCount}{' '}
          <span className="text-xs font-normal text-emerald-400">Rute High Profit</span>
        </div>
        <p className="text-xs text-emerald-400 font-medium truncate">
          Rute dengan volume & neraca seimbang
        </p>
      </div>

      {/* Metric 3: Rata-Rata Trade Imbalance */}
      <div className="bg-slate-900/80 border border-sky-500/20 rounded-2xl p-5 shadow-lg shadow-black/40 backdrop-blur-md hover:border-sky-500/40 transition-all group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Rata-Rata Trade Imbalance
          </span>
          <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform">
            <Scale className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl lg:text-3xl font-extrabold text-white mb-1">
          {avgImbalance.toFixed(2)}x
        </div>
        <p className="text-xs text-amber-400 font-medium truncate">
          Rasio Muat / Bongkar rata-rata
        </p>
      </div>

      {/* Metric 4: Estimasi Total Vol. Logistik */}
      <div className="bg-slate-900/80 border border-sky-500/20 rounded-2xl p-5 shadow-lg shadow-black/40 backdrop-blur-md hover:border-sky-500/40 transition-all group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Estimasi Vol. Logistik
          </span>
          <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform">
            <PackageCheck className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl lg:text-3xl font-extrabold text-white mb-1">
          {(totalCargoTon / 1000000).toLocaleString('id-ID', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })}{' '}
          <span className="text-xs font-normal text-cyan-300">Juta Ton</span>
        </div>
        <p className="text-xs text-cyan-400 font-medium">
          Total Akumulasi Bongkar & Muat
        </p>
      </div>
    </div>
  );
}
