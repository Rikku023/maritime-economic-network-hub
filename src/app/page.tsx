'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import SummaryCards from '@/components/SummaryCards';
import Sidebar from '@/components/Sidebar';
import PortTable from '@/components/PortTable';
import { Port, FilterState, Wilayah, JenisPelabuhan } from '@/types/port';
import { PORTS_DATA } from '@/data/ports';
import { enrichPortsWithDistance } from '@/lib/distance';
import { Loader2 } from 'lucide-react';

// Dynamic Import for MapComponent to disable SSR for Deck.gl & MapLibre
const MapComponent = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[580px] rounded-2xl bg-slate-950 border border-sky-500/20 flex flex-col items-center justify-center gap-3 text-sky-400">
      <Loader2 className="w-8 h-8 animate-spin" />
      <span className="text-sm font-medium">Memuat Peta 3D Deck.gl & MapLibre...</span>
    </div>
  ),
});

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

export default function HomePage() {
  const [ports, setPorts] = useState<Port[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    wilayah: ALL_WILAYAH,
    jenis: ALL_JENIS,
    searchQuery: '',
    hoverMode: true,
  });

  // Fetch Ports from API Route /api/ports
  useEffect(() => {
    async function fetchPorts() {
      try {
        setLoading(true);
        const res = await fetch('/api/ports');
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setPorts(json.data);
        } else {
          // Fallback to local enrichment
          setPorts(enrichPortsWithDistance(PORTS_DATA));
        }
      } catch (err) {
        console.error('API fetch error, falling back to local dataset:', err);
        setPorts(enrichPortsWithDistance(PORTS_DATA));
      } finally {
        setLoading(false);
      }
    }

    fetchPorts();
  }, []);

  // Filtered Ports memo
  const filteredPorts = useMemo(() => {
    return ports.filter((port) => {
      // Wilayah Filter
      const matchWilayah = filters.wilayah.length === 0 || filters.wilayah.includes(port.wilayah);

      // Jenis Filter
      const matchJenis = filters.jenis.length === 0 || filters.jenis.includes(port.jenis);

      // Search Query Filter
      const query = filters.searchQuery.toLowerCase().trim();
      const matchQuery =
        !query ||
        port.nama_pelabuhan.toLowerCase().includes(query) ||
        port.lokasi.toLowerCase().includes(query);

      return matchWilayah && matchJenis && matchQuery;
    });
  }, [ports, filters]);

  const handleResetFilters = () => {
    setFilters({
      wilayah: ALL_WILAYAH,
      jenis: ALL_JENIS,
      searchQuery: '',
      hoverMode: true,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14]">
      {/* Navbar */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        {/* Summary Metrics */}
        <SummaryCards ports={filteredPorts} totalPortsCount={ports.length} />

        {/* Content Layout: Sidebar + Map */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Filters */}
          <Sidebar
            filters={filters}
            onFilterChange={setFilters}
            onReset={handleResetFilters}
            totalFiltered={filteredPorts.length}
          />

          {/* Interactive Map Area */}
          <div className="flex-1">
            {loading ? (
              <div className="w-full h-[580px] rounded-2xl bg-slate-950 border border-sky-500/20 flex flex-col items-center justify-center gap-3 text-sky-400">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-sm font-medium">Memuat Data Pelabuhan...</span>
              </div>
            ) : (
              <MapComponent ports={filteredPorts} hoverMode={filters.hoverMode} />
            )}
          </div>
        </div>

        {/* Data Table Section */}
        <PortTable ports={filteredPorts} />
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 bg-slate-950 py-6 mt-12 text-center text-xs text-slate-400">
        <p>
          Maritime Economic Network Hub &copy; {new Date().getFullYear()} | Built with Next.js 14,
          Deck.gl & MapLibre GL | Vercel Deployment Ready
        </p>
      </footer>
    </div>
  );
}
