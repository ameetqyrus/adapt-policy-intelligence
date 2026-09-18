import type { Metadata } from 'next';
import { Libre_Franklin, Source_Serif_4 } from 'next/font/google';
import './globals.css';
import './workspace.css';

const dmSans = Libre_Franklin({ variable: '--font-dm-sans', subsets: ['latin'] });
const lora = Source_Serif_4({ variable: '--font-lora', subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://adapt-observatory.amitonquest.chatgpt.site'),
  title: 'ADAPT — American Dream Achievability Progress Tracker',
  description: 'Explore county outcomes, compare peers and investigate how policy and global change shape the American Dream.',
  openGraph: {
    title: 'ADAPT — Dashboard & Observatory',
    description: 'County maps, peer comparison and evidence-led policy investigation in one ADAPT workspace.',
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
  const themeScript = `(function(){try{var t=localStorage.getItem('adapt-observatory-theme');if(t==='dark')document.documentElement.dataset.theme='dark'}catch(e){}})();`;
  return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head><body className={`${dmSans.variable} ${lora.variable}`}>{children}</body></html>;
}
