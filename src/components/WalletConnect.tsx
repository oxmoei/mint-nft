'use client';

import { useAccount, useConnect, useDisconnect, useSwitchChain, useChainId } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { metaMask, injected } from '@wagmi/connectors';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Wallet, X } from 'lucide-react';
import Image from 'next/image';

// Check if device is mobile
function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

// Check if in MetaMask in-app browser
function isInMetaMaskBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as any;
  return !!(w.ethereum?.isMetaMask && w.ethereum?.isMetaMask);
}

interface WalletConnectProps {
  className?: string;
}

export default function WalletConnect({ className = '' }: WalletConnectProps) {
  const { address, isConnected, connector } = useAccount();
  const { connect, connectors, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const chainId = useChainId();
  
  const [connecting, setConnecting] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isInMetaMask, setIsInMetaMask] = useState(false);
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const connectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const walletSelectorRef = useRef<HTMLDivElement>(null);
  const switchInProgressRef = useRef(false);
  const hasRequestedMainnetSwitchRef = useRef(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
    setIsInMetaMask(isInMetaMaskBrowser());
    setIsMounted(true);
  }, []);

  // Close wallet selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (walletSelectorRef.current && !walletSelectorRef.current.contains(event.target as Node)) {
        setShowWalletSelector(false);
      }
    };

    if (showWalletSelector) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showWalletSelector]);

  // Auto switch to mainnet on connect
  useEffect(() => {
    if (isConnected && !hasRequestedMainnetSwitchRef.current && !switchInProgressRef.current) {
      hasRequestedMainnetSwitchRef.current = true;
      switchInProgressRef.current = true;
      (async () => {
        try {
          await switchChain({ chainId: mainnet.id });
        } catch (error) {
          console.error('Failed to switch to Ethereum mainnet:', error);
        } finally {
          switchInProgressRef.current = false;
        }
      })();
    }
  }, [isConnected, chainId, switchChain]);

  // Listen to connection errors
  useEffect(() => {
    if (connectError && connecting && !isConnected) {
      setStatusError(
        `Connection failed: ${connectError.message}. If not connected after returning from wallet, please retry.`
      );
      setConnecting(false);
    }
  }, [connectError, connecting, isConnected]);

  // Listen to page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isConnected && connecting) {
        setTimeout(() => {
          const w = window as any;
          if (w.ethereum?.selectedAddress) {
            try {
              connect({
                connector: metaMask({
                  dappMetadata: {
                    name: 'Mint NFT',
                    url: window.location.origin,
                  },
                })
              });
            } catch (error) {
              console.error('Reconnection error:', error);
              setConnecting(false);
            }
          } else {
            setConnecting(false);
          }
        }, 1500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [isConnected, connecting, connect, connectors]);

  // Handle wallet connection with specific connector
  const handleConnectWallet = async (selectedConnector?: any) => {
    try {
      if (!selectedConnector) {
        setStatusError('No wallet connector selected.');
        setShowWalletSelector(false);
        return;
      }
      
      setConnecting(true);
      setStatusError(null);
      
      let connectorToUse;
      const id = selectedConnector.id?.toLowerCase() || '';
      const name = selectedConnector.name?.toLowerCase() || '';
      
      if (id.includes('metamask') || id.includes('io.metamask') || name.includes('metamask')) {
        connectorToUse = metaMask({
          dappMetadata: {
            name: 'Mint NFT',
            url: window.location.origin,
          },
        });
      } else {
        connectorToUse = selectedConnector;
      }
      
      if (!connectorToUse) {
        setStatusError('No wallet available. Please install MetaMask.');
        setConnecting(false);
        setShowWalletSelector(false);
        return;
      }
      
      const isMetaMaskConnector = connectorToUse.id?.toLowerCase().includes('metamask') || 
                                  connectorToUse.id?.toLowerCase().includes('io.metamask');
      
      if (isMobile && !isInMetaMask && isMetaMaskConnector) {
        setStatusError('Please open this page in MetaMask app browser first');
        setConnecting(false);
        setShowWalletSelector(false);
        return;
      }
      
      connect({ connector: connectorToUse });
      
      setTimeout(() => {
        setShowWalletSelector(false);
      }, 200);
      
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      
      connectionTimeoutRef.current = setTimeout(() => {
        if (!isConnected) {
          setConnecting(false);
          const w = window as any;
          if (isMobile && w.ethereum?.selectedAddress) {
            setStatusError(
              'Wallet address detected but connection incomplete. Please ensure you are in the MetaMask app browser, then retry.'
            );
          } else {
            setStatusError(
              'Connection timeout. If not connected after returning from wallet, please retry.'
            );
          }
        }
      }, 15000);
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      setStatusError(
        `Connection error: ${error?.message || 'Unknown error'}`
      );
      setConnecting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
    };
  }, []);

  const handleConnect = () => {
    if (isConnected) {
      disconnect();
    } else {
      const availableWallets = getAvailableWallets();
      
      if (availableWallets.length > 0) {
        // Always show modal when clicking "Connect Wallet"
        setShowWalletSelector(true);
      } else {
        setStatusError('No supported wallet found. Please install MetaMask.');
      }
    }
  };

  // Get available wallet connectors - only MetaMask
  const getAvailableWallets = () => {
    const available: any[] = [];
    const seenTypes = new Set<string>();
    
    connectors.forEach(c => {
      if (!c || !c.id) return;

      const id = c.id.toLowerCase();
      const name = c.name?.toLowerCase() || '';
      
      if ((id.includes('metamask') || id.includes('io.metamask') || name.includes('metamask')) && !seenTypes.has('metamask')) {
        available.push({ connector: c, name: 'MetaMask', type: 'metamask' });
        seenTypes.add('metamask');
        return;
      }
    });
    
    return available;
  };

  if (!isMounted) {
    return (
      <button
        className={`px-3 sm:px-6 py-2 connectButton text-white rounded-lg transition-all font-medium text-sm sm:text-base ${className}`}
        disabled
      >
        <span className="hidden sm:inline">Connect Wallet</span>
        <span className="sm:hidden">ConnectWallet</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleConnect}
        disabled={connecting}
        className={`px-3 sm:px-6 py-2 connectButton text-white rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base ${className}`}
      >
        <div className="flex items-center justify-center gap-1 sm:gap-2">
          {connecting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span className="hidden sm:inline">Connecting...</span>
              <span className="sm:hidden">...</span>
            </>
          ) : (
            <>
              <Wallet className="w-4 h-4 flex-shrink-0" />
              <span>
                {isConnected ? (
                  `${address?.slice(0, 6)}...${address?.slice(-4)}`
                ) : (
                  <>
                    <span className="hidden sm:inline">Connect Wallet</span>
                    <span className="sm:hidden">ConnectWallet</span>
                  </>
                )}
              </span>
            </>
          )}
        </div>
      </button>
      
      {/* Wallet selector modal */}
      {isMounted && showWalletSelector && !isConnected && typeof document !== 'undefined' ? createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowWalletSelector(false);
            }
          }}
          style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
        >
          <div 
            ref={walletSelectorRef}
            className="relative bg-gradient-to-br from-[#020024] via-[#090979] to-[#00d4ff]/20 border-2 border-[#00d4ff]/30 rounded-lg w-full max-w-md mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Title bar with gradient */}
            <div className="bg-gradient-to-r from-[#020024] via-[#090979] to-[#00d4ff]/30 border-b-2 border-[#00d4ff]/30 px-6 py-4 flex items-center justify-between rounded-t-lg">
              <h2 className="text-white text-xl font-semibold uppercase tracking-wider">
                Connect Wallet
              </h2>
              <button
                onClick={() => setShowWalletSelector(false)}
                className="text-white/70 hover:text-white transition-colors font-bold text-2xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            
            {/* Wallet options */}
            <div className="p-6 space-y-3">
              {getAvailableWallets().map((wallet) => {
                const isMetaMask = wallet.type === 'metamask';
                return (
                  <button
                    key={wallet.connector.id}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleConnectWallet(wallet.connector);
                    }}
                    className="w-full flex items-center gap-4 px-6 py-4 bg-black/40 hover:bg-black/60 border-2 border-[#00d4ff]/20 hover:border-[#00d4ff]/50 rounded-lg transition-all text-left cursor-pointer group backdrop-blur-sm"
                  >
                    <div className="w-12 h-12 flex items-center justify-center flex-shrink-0 bg-black/40 rounded-lg group-hover:bg-black/60 transition-colors border border-[#00d4ff]/20">
                      {isMetaMask ? (
                        <Image
                          src="/MetaMask.svg"
                          alt="MetaMask"
                          width={40}
                          height={40}
                          className="w-10 h-10"
                        />
                      ) : (
                        <Wallet className="w-6 h-6 text-white/70" />
                      )}
                    </div>
                    <span className="text-white font-semibold text-lg">
                      {wallet.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      ) : null}
      
      {/* Error message */}
      {statusError && !isConnected && !connecting && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-red-500/20 border border-red-500/50 rounded-lg p-3 z-50 backdrop-blur-sm">
          <p className="text-xs text-red-200 break-words">
            {statusError}
          </p>
        </div>
      )}
    </div>
  );
}




