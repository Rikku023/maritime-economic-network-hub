'use client';

import React, { useState } from 'react';
import { Port } from '@/types/port';
import { formatDistance } from '@/lib/utils';
import { ArrowUpDown, Download, Anchor, MapPin } from 'lucide-react';

interface PortTableProps {
  ports: Port[];
}

type SortField = 'nama_pelabuhan' | 'lokasi' | 'wilayah' | 'jenis' | 'jarak_nm';
type SortOrder = 'asc' | 'desc';

export default function PortTable({ ports }: PortTableProps) {
  const [sortField, setSortField] = useState<SortField>('jarak_nm');
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

    if (valA === undefined) valA = 0;
    if (valB === undefined) valB = 0;

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
      'Jarak dari Tanjung Perak (NM)',
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
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `data_pelabuhan_indonesia_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900/80 border border-sky-500/20 rounded-2xl p-6 shadow-xl backdrop-blur-md mt-8">
      {/* Table Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Anchor className="w-5 h-5 text-sky-400" /> Tabel Data Pelabuhan & Jarak Pelayaran
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Daftar pelabuhan utama Indonesia dengan kalkulasi jarak laut estimasi (Haversine) dari Tanjung Perak
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
        >
          <Download className="w-4 h-4" /> Download Data (CSV)
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
                  <span>Nama Pelabuhan</span>
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
              <th className="py-3.5 px-4">Koordinat</th>
              <th
                onClick={() => handleSort('jarak_nm')}
                className="py-3.5 px-4 cursor-pointer hover:text-amber-400 transition-colors select-none text-right"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Jarak (NM)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {sortedPorts.length > 0 ? (
              sortedPorts.map((port) => {
                const isCentralHub = port.jenis === 'Central Hub';
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
                        className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                          port.jenis === 'Central Hub'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : port.jenis === 'Hub Utama'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : port.jenis === 'Feeder'
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {port.jenis}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span>
                          {port.latitude.toFixed(4)}, {port.longitude.toFixed(4)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-amber-400">
                      {formatDistance(port.jarak_nm)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
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
