import { createWalletClient, custom } from "viem";

export const CHAIN = {
  id: 84532,
  name: "base_sepolia",
  network: "base_sepolia",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [import.meta.env.VITE_RPC_URL || ""] } },
  testnet: true,
};

export function getWalletClient() {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("No injected wallet (window.ethereum)");
  }
  return createWalletClient({
    chain: CHAIN,
    transport: custom((window as any).ethereum),
  });
}

export const TARGET_CHAIN = {
  id: CHAIN.id,
  hexId: "0x14A34", // 84532 in hex
  name: CHAIN.name,
  rpcUrl: (import.meta.env.VITE_RPC_URL as string) || "",
  nativeCurrency: CHAIN.nativeCurrency,
};

export async function ensureCorrectNetwork() {
  const provider = (window as any).ethereum;
  if (!provider) throw new Error("No injected wallet");
  const current = await provider.request({ method: "eth_chainId" });
  if (current === TARGET_CHAIN.hexId) return true;
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: TARGET_CHAIN.hexId }],
    });
    return true;
  } catch (err: any) {
    if (err?.code === 4902) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: TARGET_CHAIN.hexId,
            chainName: TARGET_CHAIN.name,
            rpcUrls: [TARGET_CHAIN.rpcUrl],
            nativeCurrency: TARGET_CHAIN.nativeCurrency,
          },
        ],
      });
      return true;
    }
    throw err;
  }
}
