'use client';

import React from 'react';
import { Ship, Activity, Globe, Anchor, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="w-full bg-slate-950/80 border-b border-sky-500/20 backdrop-blur-md sticky top-0 z-50 px-4 lg:px-8 py-3.5 shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left Branding */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-400 p-0.5 shadow-lg shadow-sky-500/30 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Ship className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg lg:text-xl font-bold bg-gradient-to-r from-sky-400 via-cyan-300 to-white bg-clip-text text-transparent tracking-tight">
                Maritime Economic Network Hub
              </h1>
              <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Anchor className="w-3 h-3" /> Tanjung Perak Hub
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Sistem Informasi Pelayaran & Visualisasi 3D Rute Laut Indonesia
            </p>
          </div>
        </div>

        {/* Right Badges & Status */}
        <div className="flex items-center gap-3">
          {/* API Status Badge */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-emerald-500/30 px-3 py-1.5 rounded-full text-xs font-medium text-emerald-400 shadow-inner">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>API Online</span>
          </div>

          {/* System Version Badge */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-sky-500/20 px-3 py-1.5 rounded-full text-xs text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            <span>v2.4.0 (Vercel Ready)</span>
          </div>
        </div>
      </div>
    </header>
  );
}
