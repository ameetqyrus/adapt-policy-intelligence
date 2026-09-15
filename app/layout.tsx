import type { Metadata } from 'next';
import { Libre_Franklin, Source_Serif_4 } from 'next/font/google';
import './globals.css';
import './workspace.css';

const dmSans = Libre_Franklin({ variable: '--font-dm-sans', subsets: ['latin'] });
const lora = Source_Serif_4({ variable: '--font-lora', subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://adapt-observatory.amitonquest.chatgpt.site'),
  title: 'ADAPT Observatory — County opportunity & policy intelligence',
  description: 'Explore county outcomes, investigate policy and global change, and build your evidence base.',
  openGraph: {
    title: 'ADAPT Observatory',
    description: 'County comparison and AI impact scenario planning, grounded in ADAPT and official evidence.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'AdapT — Policy intelligence, grounded in evidence' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ADAPT Observatory',
    description: 'County comparison and AI impact scenario planning, grounded in ADAPT and official evidence.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${dmSans.variable} ${lora.variable}`}>{children}</body></html>;
}
