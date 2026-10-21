import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import '../style/globals.scss';
import Universe from '@/components/Background/Universe';
import LiquidGlass from '@/components/LiquidGlass/LiquidGlass';
import ScrollReveal from '@/components/ScrollReveal/ScrollReveal';
import MobileTabBar from '@/components/MobileTabBar/MobileTabBar';
import TransitionProvider from '@/providers/TransitionProvider';
import { noIndex, siteUrl } from '@/lib/site';

// Poppins is self-hosted (files in ./fonts, SIL Open Font License) so the
// build never depends on Google Fonts being reachable.
const poppins = localFont({
  src: [
    { path: './fonts/poppins-latin-300-normal.woff2', weight: '300', style: 'normal' },
    { path: './fonts/poppins-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './fonts/poppins-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: './fonts/poppins-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: './fonts/poppins-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Hubble Bubble: free guidance for international students',
  description:
    'A Scottish social enterprise giving international students free, independent guidance on universities, visas and careers. No commission, no agency fees.',
  openGraph: {
    siteName: 'Hubble Bubble',
    type: 'website',
    locale: 'en_GB',
    images: [{ url: '/images/social/og-default.jpg', width: 1200, height: 630, alt: 'Hubble Bubble: free university and career guidance for international students' }],
  },
  twitter: { card: 'summary_large_image' },
  ...(noIndex ? { robots: { index: false, follow: false } } : {}),
};

// The colour the phone's browser paints around the page (address bar, overscroll).
export const viewport: Viewport = {
  themeColor: '#080808',
  colorScheme: 'dark',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // data-scroll-behavior: lets Next.js scroll instantly when a link changes
    // page (e.g. to /#journey), while the page itself still scrolls smoothly.
    <html lang="en-GB" data-scroll-behavior="smooth">
      <body className={`${poppins.className} ${poppins.variable}`}>
        <a href="#main" className="skip-link" data-transition-ignore="true">Skip to content</a>
        {/* The universe behind every page: stars and bubbles that move with the finger, the mouse and the scroll. */}
        <Universe />
        <LiquidGlass />
        <ScrollReveal />
        <TransitionProvider>{children}</TransitionProvider>
        {/* Phones only: the bottom tab bar (hidden by CSS on bigger screens). */}
        <MobileTabBar />
      </body>
    </html>
  );
}
