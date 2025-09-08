import fs from "fs";
import path from "path";
import "dotenv/config";
import { Chain, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { waitForTransactionReceipt, readContract } from "viem/actions";

const RPC_URL = process.env.RPC_URL || "";
const PRIVATE_KEY = normalizePrivateKey(process.env.PRIVATE_KEY || "");
const PROJECT_ROOT = process.cwd();

function firstExisting(...candidates: string[]) {
  for (const p of candidates) if (fs.existsSync(p)) return p;
  return null;
}

// normalize and validate private key
function normalizePrivateKey(raw: string) {
  const k = raw.trim();
  if (!k) throw new Error("PRIVATE_KEY not set in .env");
  const with0x = k.startsWith("0x") ? k : `0x${k}`;
  // basic length check (0x + 64 hex chars)
  if (!/^0x[0-9a-fA-F]{64}$/.test(with0x)) {
    throw new Error(
      "Invalid PRIVATE_KEY format: expected 32 bytes hex (64 hex chars). Add 0x prefix if missing."
    );
  }
  return with0x;
}

const ABI_PATH =
  process.env.ABI_PATH ||
  firstExisting(
    path.resolve(
      PROJECT_ROOT,
      "src",
      "blockchain",
      "artifacts",
      "contracts",
      "IrlContractLedger.sol",
      "IrlContractLedger.json"
    ),
    path.resolve(
      PROJECT_ROOT,
      "blockchain",
      "artifacts",
      "contracts",
      "IrlContractLedger.sol",
      "IrlContractLedger.json"
    ),
    path.resolve(
      PROJECT_ROOT,
      "src",
      "blockchain",
      "artifacts",
      "IrlContractLedger.json"
    ),
    path.resolve(
      PROJECT_ROOT,
      "blockchain",
      "artifacts",
      "IrlContractLedger.json"
    )
  );

const CONTRACT_ADDRESS =
  process.env.CONTRACT_ADDRESS ||
  (() => {
    const f = firstExisting(
      path.resolve(PROJECT_ROOT, "src", "blockchain", "deployed-address.txt"),
      path.resolve(PROJECT_ROOT, "blockchain", "deployed-address.txt"),
      path.resolve(PROJECT_ROOT, "deployed-address.txt")
    );
    if (!f) return "";
    return fs.readFileSync(f, "utf8").trim();
  })();

if (!RPC_URL) throw new Error("RPC_URL not set in .env");
if (!PRIVATE_KEY) throw new Error("PRIVATE_KEY not set in .env");
if (!CONTRACT_ADDRESS)
  throw new Error(
    "CONTRACT_ADDRESS not set in .env or deployed-address.txt not found"
  );
if (!ABI_PATH)
  throw new Error(
    "ABI_PATH not set and artifact not found; set ABI_PATH in .env"
  );

const abi = JSON.parse(fs.readFileSync(ABI_PATH, "utf8")).abi;

const wallet = createWalletClient({
  account: privateKeyToAccount(PRIVATE_KEY as `0x${string}`),
  transport: http(RPC_URL),
});

/**
 * Writes: setApprovedSender
 */
export async function setApprovedSender(who: string, approved: boolean) {
  const txHash = await wallet.writeContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi,
    functionName: "setApprovedSender",
    args: [who as `0x${string}`, approved],
    chain: { id: 84532, name: "base_sepolia" } as Chain,
  });
  const receipt = await waitForTransactionReceipt(wallet, { hash: txHash });
  return { txHash, receipt };
}

/**
 * Writes: setApprovedRecipient
 */
export async function setApprovedRecipient(who: string, approved: boolean) {
  const txHash = await wallet.writeContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi,
    functionName: "setApprovedRecipient",
    args: [who as `0x${string}`, approved],
    chain: { id: 84532, name: "base_sepolia" } as Chain,
  });
  const receipt = await waitForTransactionReceipt(wallet, { hash: txHash });
  return { txHash, receipt };
}

/**
 * Writes: addTransaction
 */
export async function addTransaction(
  senderName: string,
  to: string,
  recipientName: string,
  amount: number | string | bigint,
  currency = "",
  purpose = "",
  date?: number
) {
  const amt = typeof amount === "bigint" ? amount : BigInt(amount);
  const dt = date ?? Math.floor(Date.now() / 1000);

  const txHash = await wallet.writeContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi,
    functionName: "addTransaction",
    args: [
      senderName,
      to as `0x${string}`,
      recipientName,
      amt,
      currency,
      purpose,
      dt,
    ],
    chain: { id: 84532, name: "base_sepolia" } as Chain,
  });

  const receipt = await waitForTransactionReceipt(wallet, { hash: txHash });
  return { txHash, receipt };
}

/**
 * Reads: getTransactionCount
 */
export async function getTransactionCount() {
  const count = await readContract(wallet, {
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi,
    functionName: "getTransactionCount",
    args: [],
  });
  return Number(count as bigint | number);
}

/**
 * Reads: getTransaction
 */
export async function getTransaction(index: number) {
  const tx = await readContract(wallet, {
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi,
    functionName: "getTransaction",
    args: [BigInt(index)],
  });
  return tx;
}

/**
 * Reads: getApprovedSenders / getApprovedRecipients
 */
export async function getApprovedSenders() {
  return await readContract(wallet, {
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi,
    functionName: "getApprovedSenders",
    args: [],
  });
}
export async function getApprovedRecipients() {
  return await readContract(wallet, {
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi,
    functionName: "getApprovedRecipients",
    args: [],
  });
}

/**
 * Writes: transferOwnership
 */
export async function transferOwnership(newOwner: string) {
  const txHash = await wallet.writeContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi,
    functionName: "transferOwnership",
    args: [newOwner as `0x${string}`],
    chain: { id: 84532, name: "base_sepolia" } as Chain,
  });
  const receipt = await waitForTransactionReceipt(wallet, { hash: txHash });
  return { txHash, receipt };
}
