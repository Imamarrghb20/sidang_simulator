import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Urai', applicationName: 'Urai', description: 'Latih jawaban. Perkuat argumen. Latihan sidang berbasis konteks penelitian, evaluasi berbukti, dan perbaikan lintas sesi.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
