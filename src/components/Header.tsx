'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import WalletConnect from './WalletConnect';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 防止 hydration 错误
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/10">
      <nav className="container mx-auto px-6 md:px-10 lg:px-70 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/assets/logo-DPgmRCGh.png"
              alt="alzelogo"
              width={80}
              height={80}
              className="rounded"
              style={{ width: 'auto', height: 'auto' }}
            />
          </Link>

          {/* Desktop Navigation */}
          <ul className="hidden md:flex items-center gap-6">
            <li>
              <Link href="/" className="text-white hover:text-cyan-400 transition-colors flex items-center gap-1">
                <span>HOME</span>
              </Link>
            </li>
            <li>
              <Link href="/id" className="text-white hover:text-cyan-400 transition-colors">
                🔥 ALZE ID
              </Link>
            </li>
            <li>
              <Link href="/nfts" className="text-white hover:text-cyan-400 transition-colors flex items-center gap-1">
                <span>ALZE NFT</span>
              </Link>
            </li>
            <li>
              <Link href="/stake" className="text-white hover:text-cyan-400 transition-colors">
                📍STAKE
              </Link>
            </li>
            <li>
              <Link href="/learn/phase1" className="text-white hover:text-cyan-400 transition-colors flex items-center gap-1">
                <span>LEARN</span>
              </Link>
            </li>
          </ul>

          {/* Connect Wallet Button */}
          <div className="flex items-center gap-4">
            <WalletConnect />

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-white p-2"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-white/10 pt-4">
            <ul className="flex flex-col gap-4">
              <li>
                <Link href="/" className="text-white hover:text-cyan-400 transition-colors block">
                  HOME
                </Link>
              </li>
              <li>
                <Link href="/id" className="text-white hover:text-cyan-400 transition-colors block">
                  🔥 ALZE ID
                </Link>
              </li>
              <li>
                <Link href="/nfts" className="text-white hover:text-cyan-400 transition-colors block">
                  ALZE NFT
                </Link>
              </li>
              <li>
                <Link href="/stake" className="text-white hover:text-cyan-400 transition-colors block">
                  📍STAKE
                </Link>
              </li>
              <li>
                <Link href="/learn/phase1" className="text-white hover:text-cyan-400 transition-colors block">
                  LEARN
                </Link>
              </li>
            </ul>
          </div>
        )}
      </nav>
    </header>
  );
}
