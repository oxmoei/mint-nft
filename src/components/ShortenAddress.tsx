'use client';

import { useState } from 'react';
import { FaCopy, FaCheck } from 'react-icons/fa';
import { RxOpenInNewWindow } from 'react-icons/rx';

interface ShortenAddressProps {
  address: string;
  explorerLink?: string;
}

export default function ShortenAddress({ address, explorerLink }: ShortenAddressProps) {
  const [copied, setCopied] = useState(false);

  const shortenedAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '';

  const copyToClipboard = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const explorerUrl = explorerLink || `https://etherscan.io/address/${address}`;

  return (
    <a
      href={explorerUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-1.5 sm:gap-2 p-2 px-3 sm:px-4 rounded-lg cursor-pointer bg-[#14285F]/50 backdrop-blur-lg hover:bg-[#14285F]/70 transition-colors h-full min-h-[44px]"
    >
      <div
        onClick={copyToClipboard}
        className="flex items-center flex-shrink-0"
      >
        {copied ? (
          <FaCheck className="text-green-400 text-sm sm:text-base" />
        ) : (
          <FaCopy className="text-white/70 text-sm sm:text-base" />
        )}
      </div>
      <span className="font-mono text-xs sm:text-sm text-white flex-1 truncate">{shortenedAddress}</span>
      <RxOpenInNewWindow className="text-white/70 group-hover:text-green-400 ml-auto transition-colors flex-shrink-0 text-sm sm:text-base" />
    </a>
  );
}

