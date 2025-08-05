'use client';

import { useRouter } from 'next/navigation';

export default function LockUnlockButton({ tokenId, className = '', children }) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/lock-unlock/${tokenId}`);
  };

  return (
    <button
      onClick={handleClick}
      className={`lock-unlock-button ${className}`}
    >
      {children || '🔒 Lock/Unlock Tokens'}
    </button>
  );
} 