'use client';

import React, { useState } from 'react';
import { Port } from '@/types/port';
import { ArrowUpDown, Download, Anchor } from 'lucide-react';

interface PortTableProps {
  ports: Port[];
}

type SortField =
  | 'nama_pelabuhan'
  | 'lokasi'
  | 'wilayah'
  | 'jenis'
  | 'jarak_round_trip_nm'
  | 'imbalance_ratio'
  | 'est_voyage_cost_idr'
  | 'market_share_pct'
  | 'status_profitability';

type SortOrder = 'asc' | 'desc';

export default function PortTable({ ports }: PortTableProps) {
  const [sortField, setSortField] = useState<SortField>('jarak_round_trip_nm');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedPorts = [...ports].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (valA === undefined) {
      if (sortField === 'jarak_round_trip_nm') valA = (a.jarak_nm || 0) * 2;
      else valA = 0;
    }
    if (valB === undefined) {
      if (sortField === 'jarak_round_trip_nm') valB = (b.jarak_nm || 0) * 2;
      else valB = 0;
    }

    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortOrder === 'asc'
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }

    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    }

    return 0;
  });

  const exportCSV = () => {
    const headers = [
      'ID',
      'Nama Pelabuhan',
      'Lokasi / Kota',
      'Wilayah',
      'Tipe Pelabuhan',
      'Latitude',
      'Longitude',
      'Jarak Single (NM)',
      'Jarak Round Trip PP (NM)',
      'Total Bongkar (Ton)',
      'Total Muat (Ton)',
      'Imbalance Ratio (TIR)',
      'Est. Voyage Cost PP (IDR)',
      'Market Share (%)',
      'Struktur Pasar HHI',
      'Status Profitability PP',
    ];

    const rows = sortedPorts.map((p) => [
      p.id,
      `"${p.nama_pelabuhan}"`,
      `"${p.lokasi}"`,
      p.wilayah,
      p.jenis,
      p.latitude,
      p.longitude,
      p.jarak_nm || 0,
      p.jarak_round_trip_nm || (p.jarak_nm ? p.jarak_nm * 2 : 0),
      p.total_bongkar_ton || 0,
      p.total_muat_ton || 0,
      p.imbalance_ratio || 0,
      p.est_voyage_cost_idr || (p.est_fuel_cost_idr || 0) + (p.est_port_cost_idr || 0),
      p.market_share_pct || 0,
      `"${p.hhi_market_status || 'N/A'}"`,
      `"${p.status_profitability || 'N/A'}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `analisis_ekonometrika_round_trip_pp_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTipeBadgeStyle = (jenis: string) => {
    const j = (jenis || '').toLowerCase().trim();
    if (j.includes('central')) {
      return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    }
    if (j.includes('utama')) {
      return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    }
    if (j.includes('feeder')) {
      return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    }
    if (j.includes('penyeberangan') || j.includes('penyebrangan')) {
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
    return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
  };

  const getProfitabilityBadgeStyle = (status?: string) => {
    const s = (status || '').toLowerCase().trim();
    if (s.includes('high profit')) {
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
    if (s.includes('balanced')) {
      return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    }
    if (s.includes('low profit') || s.includes('imbalance')) {
      return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    }
    return 'bg-slate-800 text-slate-400 border-slate-700';
  };

  return (
    <div className="bg-slate-900/80 border border-sky-500/20 rounded-2xl p-6 shadow-xl backdrop-blur-md mt-8">
      {/* Table Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Anchor className="w-5 h-5 text-sky-400" /> Data Analisis Ekonometrika Round Trip (PP)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Kalkulasi Skenario Pulang-Pergi (PP): Jarak PP (NM), Est. Voyage Cost PP, Imbalance Ratio (TIR), Market Share (%), dan Profitability Status
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
        >
          <Download className="w-4 h-4" /> Download Analytics (CSV)
        </button>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th
                onClick={() => handleSort('nama_pelabuhan')}
                className="py-3.5 px-4 cursor-pointer hover:text-sky-400 transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Pelabuhan</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('lokasi')}
                className="py-3.5 px-4 cursor-pointer hover:text-sky-400 transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Kota / Provinsi</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('wilayah')}
                className="py-3.5 px-4 cursor-pointer hover:text-sky-400 transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Wilayah</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('jenis')}
                className="py-3.5 px-4 cursor-pointer hover:text-sky-400 transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Tipe</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('jarak_round_trip_nm')}
                className="py-3.5 px-4 cursor-pointer hover:text-amber-400 transition-colors select-none text-right"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Jarak PP (NM)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('imbalance_ratio')}
                className="py-3.5 px-4 cursor-pointer hover:text-emerald-400 transition-colors select-none text-right"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Imbalance Ratio</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('est_voyage_cost_idr')}
                className="py-3.5 px-4 cursor-pointer hover:text-cyan-400 transition-colors select-none text-right"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Est. Cost PP</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('market_share_pct')}
                className="py-3.5 px-4 cursor-pointer hover:text-purple-400 transition-colors select-none text-right"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Market Share</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('status_profitability')}
                className="py-3.5 px-4 cursor-pointer hover:text-sky-400 transition-colors select-none text-center"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>Profitability Status (PP)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {sortedPorts.length > 0 ? (
              sortedPorts.map((port) => {
                const isCentralHub = port.jenis === 'Central Hub';
                const distPP = port.jarak_round_trip_nm || (port.jarak_nm ? port.jarak_nm * 2 : 0);
                const voyageCostPP = port.est_voyage_cost_idr || ((port.est_fuel_cost_idr || 0) + (port.est_port_cost_idr || 0));

                return (
                  <tr
                    key={port.id}
                    className={`hover:bg-sky-500/5 transition-colors ${
                      isCentralHub ? 'bg-rose-500/10 font-semibold' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-slate-100 font-medium">
                      <div className="flex items-center gap-2">
                        {isCentralHub && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                        )}
                        <span>{port.nama_pelabuhan}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{port.lokasi}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/50 text-[11px]">
                        {port.wilayah}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${getTipeBadgeStyle(
                          port.jenis
                        )}`}
                      >
                        {port.jenis}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-amber-400 font-mono">
                      {distPP > 0 ? `${distPP.toLocaleString('id-ID')} NM` : '0 NM'}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-400 font-mono">
                      {port.imbalance_ratio !== undefined ? `${port.imbalance_ratio.toFixed(2)}x` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-200 font-mono">
                      {voyageCostPP !== undefined && voyageCostPP > 0
                        ? `Rp ${(voyageCostPP / 1000000).toLocaleString('id-ID', {
                            maximumFractionDigits: 1,
                          })} Jt`
                        : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-purple-300 font-mono">
                      {port.market_share_pct !== undefined ? `${port.market_share_pct.toFixed(1)}%` : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {port.status_profitability ? (
                        <span
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${getProfitabilityBadgeStyle(
                            port.status_profitability
                          )}`}
                        >
                          {port.status_profitability}
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500">
                  Tidak ada pelabuhan yang cocok dengan kriteria filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
