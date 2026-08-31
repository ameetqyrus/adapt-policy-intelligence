import type { Metadata } from 'next';
import { Libre_Franklin, Source_Serif_4 } from 'next/font/google';
import './globals.css';

const dmSans = Libre_Franklin({ variable: '--font-dm-sans', subsets: ['latin'] });
const lora = Source_Serif_4({ variable: '--font-lora', subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://adapt-policy-intelligence.amitonquest.chatgpt.site'),
  title: 'AdapT — Policy Intelligence',
  description: 'ADAPT-grounded peer-county comparisons with official policy evidence.',
  openGraph: {
    title: 'AdapT — Policy Intelligence',
    description: 'Peer-county policy intelligence, grounded in ADAPT data and official evidence.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'AdapT — Policy intelligence, grounded in evidence' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AdapT — Policy Intelligence',
    description: 'Peer-county policy intelligence, grounded in ADAPT data and official evidence.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${dmSans.variable} ${lora.variable}`}>{children}</body></html>;
}
