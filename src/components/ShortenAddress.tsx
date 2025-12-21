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
      className="group flex items-center gap-2 p-2 px-4 rounded-lg cursor-pointer bg-[#14285F]/50 backdrop-blur-lg hover:bg-[#14285F]/70 transition-colors h-full"
    >
      <div
        onClick={copyToClipboard}
        className="flex items-center"
      >
        {copied ? (
          <FaCheck className="text-green-400" />
        ) : (
          <FaCopy className="text-white/70" />
        )}
      </div>
      <span className="font-mono text-sm text-white flex-1">{shortenedAddress}</span>
      <RxOpenInNewWindow className="text-white/70 group-hover:text-green-400 ml-auto transition-colors" />
    </a>
  );
}

