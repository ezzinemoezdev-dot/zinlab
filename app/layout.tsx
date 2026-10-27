import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'ZinLab — Gestion du laboratoire', description: 'Gestion des classes, séances, présences, notes et postes informatiques.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>;
}
