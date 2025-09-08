import abiJson from "./abi/IRLContractLedger.json";
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
