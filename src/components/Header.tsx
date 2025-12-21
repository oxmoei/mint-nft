'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
      <nav className="container mx-auto px-4 sm:px-6 md:px-10 lg:px-70 py-3 md:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href="https://www.alze.xyz/" className="flex items-center gap-2" target="_blank" rel="noopener noreferrer">
            <div className="relative">
              <img
                src="/Netlify-logo1.png"
                alt="Netlify logo"
                className="bg-transparent relative z-10 opacity-100 h-8 sm:h-10 w-auto"
                style={{ 
                  backgroundColor: 'transparent',
                  background: 'transparent',
                  opacity: 1,
                  filter: 'invert(1) brightness(1.2) contrast(1.1)',
                  WebkitFilter: 'invert(1) brightness(1.2) contrast(1.1)'
                }}
              />
            </div>
          </a>

          {/* Desktop Navigation */}
          <ul className="hidden md:flex items-center gap-4 lg:gap-6">
            <li>
              <a href="https://www.alze.xyz/" className="text-white hover:text-cyan-400 transition-colors flex items-center gap-1 text-sm lg:text-base" target="_blank" rel="noopener noreferrer">
                <span>HOME</span>
              </a>
            </li>
            <li>
              <a href="https://www.alze.xyz/id" className="text-white hover:text-cyan-400 transition-colors text-sm lg:text-base" target="_blank" rel="noopener noreferrer">
                🔥 NETLIFY ID
              </a>
            </li>
            <li>
              <a href="https://www.alze.xyz/nfts" className="text-white hover:text-cyan-400 transition-colors flex items-center gap-1 text-sm lg:text-base" target="_blank" rel="noopener noreferrer">
                <span>NETLIFY NFT</span>
              </a>
            </li>
            <li>
              <a href="https://www.alze.xyz/stake" className="text-white hover:text-cyan-400 transition-colors text-sm lg:text-base" target="_blank" rel="noopener noreferrer">
                📍STAKE
              </a>
            </li>
            <li>
              <a href="https://www.alze.xyz/learn/phase1" className="text-white hover:text-cyan-400 transition-colors flex items-center gap-1 text-sm lg:text-base" target="_blank" rel="noopener noreferrer">
                <span>LEARN</span>
              </a>
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
            <ul className="flex flex-col gap-3">
              <li>
                <a href="https://www.alze.xyz/" className="text-white hover:text-cyan-400 transition-colors block" target="_blank" rel="noopener noreferrer">
                  HOME
                </a>
              </li>
              <li>
                <a href="https://www.alze.xyz/id" className="text-white hover:text-cyan-400 transition-colors block" target="_blank" rel="noopener noreferrer">
                  🔥 NETLIFY ID
                </a>
              </li>
              <li>
                <a href="https://www.alze.xyz/nfts" className="text-white hover:text-cyan-400 transition-colors block" target="_blank" rel="noopener noreferrer">
                  NETLIFY NFT
                </a>
              </li>
              <li>
                <a href="https://www.alze.xyz/stake" className="text-white hover:text-cyan-400 transition-colors block" target="_blank" rel="noopener noreferrer">
                  📍STAKE
                </a>
              </li>
              <li>
                <a href="https://www.alze.xyz/learn/phase1" className="text-white hover:text-cyan-400 transition-colors block" target="_blank" rel="noopener noreferrer">
                  LEARN
                </a>
              </li>
            </ul>
          </div>
        )}
      </nav>
    </header>
  );
}
