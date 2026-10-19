import type { Metadata } from 'next';
import localFont from 'next/font/local';
import '../style/globals.scss';
import ParallaxStars from '@/components/Background/ParallaxStars';
import ShootingStars from '@/components/Background/ShootingStars';
import ScrollReveal from '@/components/ScrollReveal/ScrollReveal';
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
  title: 'Hubble Works',
  description: 'Fuel your passion with the perfect counsel',
  ...(noIndex ? { robots: { index: false, follow: false } } : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.className} ${poppins.variable}`}>
         <ParallaxStars />
        {/* <ShootingStars />  */}
        <ScrollReveal />
        <TransitionProvider>{children}</TransitionProvider>
      </body>
    </html>
  );
}
