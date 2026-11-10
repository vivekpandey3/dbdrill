import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DBDrill — Multi-Engine Database Disaster Recovery & Chaos Testing',
  description: 'Automated PostgreSQL & MongoDB disaster recovery drill runner in isolated Docker sandboxes.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
        {children}
      </body>
    </html>
  );
}

