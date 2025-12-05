import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-sky-100 font-sans">
      <main className="w-full">
        {/* Hero Section with Scientist on Left */}
        <section className="w-full py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
              {/* Dr. Teiko Image - Left Side */}
              <div className="flex-shrink-0 w-full lg:w-1/2 flex justify-center lg:justify-start">
                <Image
                  src="/dr teiko.png"
                  alt="Dr. Teiko"
                  width={600}
                  height={600}
                  className="w-full max-w-md lg:max-w-lg h-auto object-contain"
                  priority
                />
              </div>

              {/* Content - Right Side */}
              <div className="flex-1 text-center lg:text-left lg:pl-8">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-black mb-4">
                  The #1 Token on Stacks— Bitcoin Layer 2!
                </h1>
                <p className="text-xl sm:text-2xl md:text-3xl font-semibold text-zinc-800 mb-8">
                  $TEIKO = Where There's Always an Opportunity to Earn Bitcoin! ⚡
                </p>
                <div className="mt-8">
                  <a
                    href="https://stx.city/bonding-curve/SP1T0VY3DNXRVP6HBM75DFWW0199CR0X15PC1D81B.teiko-token-stxcity-dex/SP1T0VY3DNXRVP6HBM75DFWW0199CR0X15PC1D81B.teiko-token-stxcity/SP359XMJYWRDY24H7VDYJWKPAGHN75V8M0W1NBF3P"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-8 py-4 bg-black text-white rounded-full text-lg font-bold hover:bg-zinc-800 transition-colors shadow-lg"
                  >
                    Buy $TEIKO Now
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
