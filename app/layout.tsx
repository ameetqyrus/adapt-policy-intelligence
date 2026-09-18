import type { Metadata } from 'next';
import { Libre_Franklin, Source_Serif_4 } from 'next/font/google';
import './globals.css';
import './workspace.css';

const dmSans = Libre_Franklin({ variable: '--font-dm-sans', subsets: ['latin'] });
const lora = Source_Serif_4({ variable: '--font-lora', subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://adapt-unified-observatory.amitonquest.chatgpt.site'),
  title: 'ADAPT — Tracking the American Dream, County by County',
  description: 'The American Dream Achievability Progress Tracker measures county-level economic opportunity for the 60% of American workers without a four-year degree.',
  openGraph: {
    title: 'ADAPT — Tracking the American Dream, County by County',
    description: 'County-level economic opportunity data for workers without a four-year degree, from the Georgetown Lab for Globalization and Shared Prosperity.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'AdapT — Policy intelligence, grounded in evidence' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ADAPT — Tracking the American Dream, County by County',
    description: 'County-level economic opportunity data for workers without a four-year degree, from the Georgetown Lab for Globalization and Shared Prosperity.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const themeScript = `(function(){try{var t=localStorage.getItem('adapt-observatory-theme');if(t==='dark')document.documentElement.dataset.theme='dark'}catch(e){}})();`;
  return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head><body className={`${dmSans.variable} ${lora.variable}`}>{children}</body></html>;
}
