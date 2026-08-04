import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Maritime Economic Network Hub - Tanjung Perak Surabaya',
  description: 'Peta Interaktif 3D Jaringan Pelayaran Indonesia Berbasis Next.js 14, Deck.gl, dan MapLibre GL',
  keywords: ['Maritime', 'Indonesia Ports', 'Pelabuhan Tanjung Perak', 'Deck.gl', 'Next.js 14', 'Vercel'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <body className="bg-[#070b14] text-slate-100 min-h-screen antialiased selection:bg-sky-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
