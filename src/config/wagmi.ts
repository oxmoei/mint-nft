import { createConfig } from 'wagmi';
import { mainnet, sepolia, bsc, polygon, arbitrum, base, optimism } from 'wagmi/chains';
import { http } from 'viem';
import { metaMask, injected } from '@wagmi/connectors';

// Create OKX wallet connector - only detects OKX wallet
const okxConnector = injected({
  // target 返回实际的 EIP-1193 provider（或 undefined），以满足类型要求
  target: () => {
    if (typeof window === 'undefined') return undefined;
    const okxProvider =
      (window as any).okxwallet?.ethereum || (window as any).okxwallet;
    return okxProvider || undefined;
  },
});

// Create MetaMask connector with dappMetadata
const metaMaskConnector = metaMask({
  dappMetadata: {
    name: 'Mint NFT',
    url: typeof window !== 'undefined' ? window.location.origin : '',
  },
});

export const config = createConfig({
  // 支持主网 + BSC + 常用 L2
  chains: [mainnet, bsc, base, arbitrum, polygon, optimism, sepolia],
  connectors: [
    metaMaskConnector,
    okxConnector,
  ],
  transports: {
    [mainnet.id]: http(),
    [bsc.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
    [optimism.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: false,
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}

