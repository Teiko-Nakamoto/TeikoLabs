'use client';
import Link from 'next/link';
import Header from './components/header';
import './globals.css'; // make sure this line exists

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="home-page">
        <Link href="/create-token">
          <button className="create-token-btn">Create Token</button>
        </Link>
      </main>
    </>
  );
}
