import abiJson from "./abi/BSCS4BBudgetBill.json";
import { getWalletClient, ensureCorrectNetwork, CHAIN } from "./viemClient";
import { createPublicClient, http } from "viem";
import { waitForTransactionReceipt } from "viem/actions";

const CONTRACT_ADDRESS =
  (import.meta.env.VITE_CONTRACT_ADDRESS as string) || "";
const RPC_URL = (import.meta.env.VITE_RPC_URL as string) || "";

export async function connectWallet(): Promise<string> {
  const provider = (window as any).ethereum;
  if (!provider) throw new Error("No wallet");
  await provider.request({ method: "eth_requestAccounts" });
  const accounts: string[] = await provider.request({ method: "eth_accounts" });
  return accounts[0];
}

async function clearSiteData() {
  try {
    // clear cookies for current host (and parent domains)
    document.cookie.split(";").forEach((c) => {
      const name = c.split("=")[0].trim();
      // remove cookie for many domain scopes
      const expires = "expires=Thu, 01 Jan 1970 00:00:00 GMT;";
      document.cookie = `${name}=;${expires}path=/`;
      const host = location.hostname.split(".");
      for (let i = 0; i < host.length - 1; i++) {
        const domain = "." + host.slice(i).join(".");
        document.cookie = `${name}=;${expires}path=/;domain=${domain}`;
      }
    });

    // clear local/session storage
    try {
      sessionStorage.clear();
    } catch {}
    try {
      localStorage.clear();
    } catch {}

    // clear Cache Storage
    if ("caches" in window) {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch {}
    }

    // delete all IndexedDB databases (if API available)
    if (typeof indexedDB !== "undefined" && (indexedDB as any).databases) {
      try {
        const dbs = await (indexedDB as any).databases();
        await Promise.all(
          dbs.map(
            (db: any) =>
              new Promise((resolve) => {
                try {
                  indexedDB.deleteDatabase(db.name).onsuccess = () =>
                    resolve(true);
                } catch {
                  resolve(false);
                }
              })
          )
        );
      } catch {
        // fallback: attempt to delete common DB names if you know them
      }
    }

    // unregister service workers
    if ("serviceWorker" in navigator) {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      } catch {}
    }
  } catch (err) {
    console.warn("clearSiteData error:", err);
  }
}

export async function disconnectWallet() {
  try {
    const provider = (window as any).ethereum;

    await clearSiteData();

    // Try to disconnect any wallet client (WalletConnect / viem) if available
    try {
      const wc = getWalletClient();
      if (wc && typeof (wc as any).disconnect === "function") {
        try {
          alert("disconnected");
          await (wc as any).disconnect();
        } catch (err) {
          alert("disconnect failed");
          console.warn("walletClient.disconnect() failed:", err);
        }
      }
    } catch (err) {
      // ignore if getWalletClient isn't available or fails
    }

    // If provider supports an explicit disconnect (e.g. WalletConnect), call it.
    if (provider?.disconnect && typeof provider.disconnect === "function") {
      try {
        await provider.disconnect();
      } catch (err) {
        console.warn("provider.disconnect() failed:", err);
      }
    }

    // Remove common listeners you may have added elsewhere
    try {
      if (provider?.removeListener) {
        provider.removeListener("accountsChanged", () => {});
        provider.removeListener("chainChanged", () => {});
        provider.removeListener("disconnect", () => {});
      }
    } catch (err) {
      console.warn("removeListener failed:", err);
    }

    // Clear app-local connection state (localStorage/session as used)
    try {
      localStorage.removeItem("connectedAccount");
      sessionStorage.removeItem("connectedAccount");
    } catch {}

    // Notify app/UI to update
    window.dispatchEvent(new CustomEvent("wallet-disconnected"));

    // NOTE: MetaMask does NOT support forcing a disconnect; user must revoke in wallet UI.
    return;
  } catch (err) {
    console.warn("disconnectWallet error:", err);
  }
}
// ...existing code...

function getPublicClient() {
  if (!RPC_URL) throw new Error("VITE_RPC_URL not set");
  return createPublicClient({ chain: CHAIN, transport: http(RPC_URL) });
}

export async function addTransaction(
  senderName: string,
  to: string,
  recipientName: string,
  amount: number | string | bigint,
  currency = "",
  purpose = ""
) {
  if (!CONTRACT_ADDRESS) throw new Error("CONTRACT_ADDRESS not configured");
  // ensure wallet network matches target
  await ensureCorrectNetwork();

  const walletClient = getWalletClient();
  const accounts: string[] = await (window as any).ethereum.request({
    method: "eth_accounts",
  });
  const account = accounts[0] as `0x${string}`;
  const amt = typeof amount === "bigint" ? amount : BigInt(amount);

  // estimate gas with a reliable public RPC
  const publicClient = getPublicClient();
  const estimatedGas = await publicClient.estimateContractGas({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: abiJson.abi,
    functionName: "addTransaction",
    args: [
      senderName,
      to as `0x${string}`,
      recipientName,
      amt,
      currency,
      purpose,
      Math.floor(Date.now() / 1000),
    ],
    account,
  });

  // optional: add a small safety margin
  const gasLimit =
    estimatedGas + BigInt(Math.floor(Number(estimatedGas) * 0.2)); // +20%

  // send via injected wallet (user will confirm in their wallet)
  const txHash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: abiJson.abi,
    functionName: "addTransaction",
    args: [
      senderName,
      to as `0x${string}`,
      recipientName,
      amt,
      currency,
      purpose,
      Math.floor(Date.now() / 1000),
    ],
    account,
    gas: gasLimit,
  });

  // wait for receipt using walletClient
  const receipt = await waitForTransactionReceipt(walletClient, {
    hash: txHash,
  });
  return { txHash, receipt };
}
