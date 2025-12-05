export default function Whitepaper() {
  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#4A7BA7' }}>
      <main className="w-full py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-black mb-4">
              TEIKO Whitepaper
            </h1>
          </div>

          {/* Origin Story */}
          <section className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/20">
            <h2 className="text-3xl font-bold text-black mb-6">The Origin Story</h2>
            <div className="space-y-4 text-lg text-black leading-relaxed">
              <p>
                Once upon a time, Dr. Teiko was mixing ingredients in the lab:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Bitcoin</strong> — the foundation</li>
                <li><strong>Stacks</strong> — the layer</li>
                <li><strong>Smart Contracts</strong> — the magic</li>
              </ul>
              <p>
                Then, by accident, someone added a dash of <strong>PoX (Proof-of-Transfer)</strong>.
              </p>
              <p className="text-xl font-bold mt-6">
                💥 BOOM! 💥
              </p>
              <p>
                The TEIKO token was born — creating an <strong>infinite yield loop</strong> that pays real Bitcoin to holders.
              </p>
            </div>
          </section>

          {/* The Strategy */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold text-black mb-6">How It Works</h2>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 mb-6">
              <h3 className="text-xl font-bold text-black mb-6 text-center">The Infinite Yield Loop</h3>
              
              {/* Simple List Format */}
              <div className="space-y-4 text-base text-black/90">
                <div className="font-semibold text-black">Step 1: People buy TEIKO</div>
                <div className="font-semibold text-black">Step 2: Leverage TEIKO Treasury</div>
                <div className="font-semibold text-black">Step 3: Stake for Bitcoin via Proof of Transfer</div>
                <div className="font-semibold text-black">The infinite loop repeats</div>
              </div>
            </div>

          </section>
        </div>
      </main>
    </div>
  );
}
