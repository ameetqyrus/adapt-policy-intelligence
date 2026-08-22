import type { Metadata } from 'next';
import { DM_Sans, Lora } from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({ variable: '--font-dm-sans', subsets: ['latin'] });
const lora = Lora({ variable: '--font-lora', subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: 'AdapT — Policy Intelligence',
  description: 'Evidence-grounded climate adaptation intelligence for public policy decisions.',
  openGraph: {
    title: 'AdapT — Policy Intelligence',
    description: 'Policy intelligence, grounded in evidence.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'AdapT — Policy intelligence, grounded in evidence' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AdapT — Policy Intelligence',
    description: 'Policy intelligence, grounded in evidence.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${dmSans.variable} ${lora.variable}`}>{children}</body></html>;
}
