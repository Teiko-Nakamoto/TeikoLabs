import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Teiko Labs: Trade on Bitcoin Layer 3",
  description: "Trade on The MAS Network Protocol, Bitcoin's Layer 3 and unlock the power of MAS Sats",
  icons: {
    icon: "/logo.png",     // favicon for browser tab
    shortcut: "/logo.png", // for pinned shortcuts
    apple: "/logo.png",    // for iOS home screen
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
