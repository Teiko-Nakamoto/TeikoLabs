import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="w-full border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="Teiko Labs Logo"
              width={40}
              height={40}
              className="object-contain"
            />
            <span className="ml-3 text-xl font-bold text-black dark:text-zinc-50">
              Teiko Labs
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-colors"
            >
              Home
            </Link>
            <Link
              href="#about"
              className="text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-colors"
            >
              About
            </Link>
            <Link
              href="#tokenomics"
              className="text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-colors"
            >
              Tokenomics
            </Link>
          </div>

          {/* Buy Button */}
          <a
            href="https://stx.city/bonding-curve/SP1T0VY3DNXRVP6HBM75DFWW0199CR0X15PC1D81B.teiko-token-stxcity-dex/SP1T0VY3DNXRVP6HBM75DFWW0199CR0X15PC1D81B.teiko-token-stxcity/SP359XMJYWRDY24H7VDYJWKPAGHN75V8M0W1NBF3P"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-full font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            Buy $TEIKO
          </a>
        </div>
      </div>
    </nav>
  );
}

