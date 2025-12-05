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
          <div className="flex items-center space-x-6">
            <Link
              href="/whitepaper"
              className="text-black dark:text-zinc-50 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors font-medium"
            >
              White Paper
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

