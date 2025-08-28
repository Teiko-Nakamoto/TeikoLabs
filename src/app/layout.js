import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from '@vercel/speed-insights/next';
import "./globals.css";

// Preload critical fonts with performance optimizations
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

export const metadata = {
  // Basic SEO
  title: "Teiko Labs - Bitcoin DeFi Trading Platform | MAS Network Protocol",
  description: "Bitcoin Layer 3 DeFi trading platform. Home of MAS Sats with real trading profit anyone can claim.",
  keywords: "Bitcoin DeFi, The Forever Pump Protocol, MAS Sats, Stacks blockchain, decentralized trading, cryptocurrency, Bitcoin Layer 3, DeFi platform, token trading, blockchain trading, meme coin, sBTC, STX, Stacks, Pump.fun, staking, yield farming, liquidity pools, yield farm, The MAS Network, Bitcoin DeFi tokens, Stacks DeFi, sBTC trading, meme coin trading, DeFi staking, yield optimization, liquidity mining, Bitcoin Layer 3 DeFi, Stacks ecosystem, DeFi yield farming, cryptocurrency staking, Bitcoin DeFi platform",
  authors: [{ name: "Teiko Labs" }],
  creator: "Teiko Labs",
  publisher: "Teiko Labs",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // Open Graph (Facebook, LinkedIn)
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://teikolabs.com', // Replace with your actual domain
    siteName: 'Teiko Labs',
    title: 'Teiko Labs - Bitcoin DeFi Trading Platform | MAS Network Protocol',
    description: 'Bitcoin Layer 3 DeFi trading platform. Home of MAS Sats with real trading profit anyone can claim.',
    images: [
      {
        url: '/logo.png', // Replace with your actual OG image
        width: 1200,
        height: 630,
        alt: 'Teiko Labs - Bitcoin DeFi Trading Platform',
      },
    ],
  },
  
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    site: '@TeikoLabs', // Replace with your actual Twitter handle
    creator: '@TeikoLabs', // Replace with your actual Twitter handle
    title: 'Teiko Labs - Bitcoin DeFi Trading Platform',
    description: 'Bitcoin Layer 3 DeFi trading platform. Home of MAS Sats with real trading profit anyone can claim.',
    images: ['/logo.png'], // Replace with your actual Twitter image
  },
  
  // Icons
  icons: {
    icon: [
      { url: '/logo.png', sizes: '32x32', type: 'image/png' },
      { url: '/logo.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/logo.png',
    apple: [
      { url: '/logo.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  
  // Additional SEO
  alternates: {
    canonical: 'https://teikolabs.com', // Replace with your actual domain
  },
  
  // Verification
  verification: {
    google: 'your-google-verification-code', // Replace with your Google Search Console verification code
    // yandex: 'your-yandex-verification-code',
    // yahoo: 'your-yahoo-verification-code',
  },
  
  // Category
  category: 'technology',
  
  // Classification
  classification: 'Bitcoin DeFi Trading Platform',
  
  // Other
  referrer: 'origin-when-cross-origin',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        
        {/* Preload critical resources */}
        <link rel="preload" href="/logo.png" as="image" type="image/png" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Additional SEO Meta Tags */}
        <meta name="theme-color" content="#1a1a2e" />
        <meta name="color-scheme" content="dark" />
        <meta name="application-name" content="Teiko Labs" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Teiko Labs" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#1a1a2e" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Structured Data for Rich Snippets */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Teiko Labs",
              "description": "Bitcoin DeFi trading platform on The Forever Pump Protocol",
              "url": "https://teikolabs.com",
              "applicationCategory": "FinanceApplication",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "author": {
                "@type": "Organization",
                "name": "Teiko Labs"
              },
              "publisher": {
                "@type": "Organization",
                "name": "Teiko Labs"
              }
            })
          }}
        />
        
        {/* Additional Structured Data for Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Teiko Labs",
              "url": "https://teikolabs.com",
              "logo": "https://teikolabs.com/logo.png",
              "description": "Bitcoin DeFi trading platform on The Forever Pump Protocol",
              "sameAs": [
                "https://twitter.com/TeikoLabs",
                "https://github.com/TeikoLabs"
              ]
            })
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
