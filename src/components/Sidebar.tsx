'use client';

import React from 'react';
import { FilterState, Wilayah, JenisPelabuhan } from '@/types/port';
import { Search, Filter, Layers, Eye, RefreshCw, CheckSquare, Square } from 'lucide-react';

interface SidebarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onReset: () => void;
  totalFiltered: number;
}

const ALL_WILAYAH: Wilayah[] = [
  'Jawa',
  'Sumatra',
  'Kalimantan',
  'Sulawesi',
  'Bali-Nusra',
  'Maluku-Papua',
];

const ALL_JENIS: JenisPelabuhan[] = [
  'Central Hub',
  'Hub Utama',
  'Feeder',
  'Penyeberangan',
];

export default function Sidebar({
  filters,
  onFilterChange,
  onReset,
  totalFiltered,
}: SidebarProps) {
  const handleWilayahToggle = (w: Wilayah) => {
    const exists = filters.wilayah.includes(w);
    const updated = exists
      ? filters.wilayah.filter((item) => item !== w)
      : [...filters.wilayah, w];
    onFilterChange({ ...filters, wilayah: updated });
  };

  const handleJenisToggle = (j: JenisPelabuhan) => {
    const exists = filters.jenis.includes(j);
    const updated = exists
      ? filters.jenis.filter((item) => item !== j)
      : [...filters.jenis, j];
    onFilterChange({ ...filters, jenis: updated });
  };

  const handleSelectAllWilayah = () => {
    onFilterChange({
      ...filters,
      wilayah: filters.wilayah.length === ALL_WILAYAH.length ? [] : [...ALL_WILAYAH],
    });
  };

  const handleSelectAllJenis = () => {
    onFilterChange({
      ...filters,
      jenis: filters.jenis.length === ALL_JENIS.length ? [] : [...ALL_JENIS],
    });
  };

  return (
    <aside className="w-full lg:w-80 bg-slate-900/90 border border-sky-500/20 rounded-2xl p-5 shadow-xl backdrop-blur-md flex flex-col gap-6">
      {/* Header & Reset */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-sky-400 font-bold text-base">
          <Filter className="w-4 h-4" />
          <span>Filter & Pencarian</span>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-slate-400 hover:text-sky-400 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg bg-slate-800/60 border border-slate-700/50"
        >
          <RefreshCw className="w-3 h-3" /> Reset
        </button>
      </div>

      {/* Search Input */}
      <div>
        <label className="text-xs font-medium text-slate-300 mb-2 block">
          Pencarian Pelabuhan
        </label>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama atau kota..."
            value={filters.searchQuery}
            onChange={(e) =>
              onFilterChange({ ...filters, searchQuery: e.target.value })
            }
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
          />
        </div>
      </div>

      {/* Hover Mode Arc Toggle */}
      <div className="bg-slate-950/60 border border-sky-500/20 rounded-xl p-3.5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-sky-300 flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-cyan-400" /> Mode Garis Rute (Arc 3D)
          </span>
        </div>
        <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filters.hoverMode}
            onChange={(e) =>
              onFilterChange({ ...filters, hoverMode: e.target.checked })
            }
            className="w-4 h-4 rounded accent-sky-500 cursor-pointer"
          />
          <span>Hanya tampil saat cursor hover pelabuhan</span>
        </label>
      </div>

      {/* Filter Kategori Wilayah */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-sky-400" /> Kategori Wilayah
          </span>
          <button
            onClick={handleSelectAllWilayah}
            className="text-[11px] text-sky-400 hover:underline"
          >
            {filters.wilayah.length === ALL_WILAYAH.length ? 'Batal Semua' : 'Pilih Semua'}
          </button>
        </div>

        <div className="space-y-1.5">
          {ALL_WILAYAH.map((w) => {
            const isChecked = filters.wilayah.includes(w);
            return (
              <button
                key={w}
                onClick={() => handleWilayahToggle(w)}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-all ${
                  isChecked
                    ? 'bg-sky-500/15 border border-sky-500/40 text-sky-200'
                    : 'bg-slate-950/40 border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <span>{w}</span>
                {isChecked ? (
                  <CheckSquare className="w-3.5 h-3.5 text-sky-400" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-slate-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Tipe Pelabuhan */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-sky-400" /> Tipe Pelabuhan
          </span>
          <button
            onClick={handleSelectAllJenis}
            className="text-[11px] text-sky-400 hover:underline"
          >
            {filters.jenis.length === ALL_JENIS.length ? 'Batal Semua' : 'Pilih Semua'}
          </button>
        </div>

        <div className="space-y-1.5">
          {ALL_JENIS.map((j) => {
            const isChecked = filters.jenis.includes(j);
            let badgeColor = 'text-sky-400';
            if (j === 'Central Hub') badgeColor = 'text-rose-400';
            if (j === 'Hub Utama') badgeColor = 'text-amber-400';
            if (j === 'Penyeberangan') badgeColor = 'text-emerald-400';

            return (
              <button
                key={j}
                onClick={() => handleJenisToggle(j)}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-all ${
                  isChecked
                    ? 'bg-slate-800/80 border border-slate-700 text-slate-100'
                    : 'bg-slate-950/40 border border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className={badgeColor}>{j}</span>
                {isChecked ? (
                  <CheckSquare className="w-3.5 h-3.5 text-sky-400" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-slate-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Footer Info */}
      <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 text-center">
        Menampilkan <strong className="text-sky-400">{totalFiltered}</strong> pelabuhan aktif
      </div>
    </aside>
  );
}
