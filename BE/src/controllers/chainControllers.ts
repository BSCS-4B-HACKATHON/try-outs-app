import { Request, Response } from "express";
import {
  setApprovedSender,
  setApprovedRecipient,
  addTransaction,
  getTransaction,
  getTransactionCount,
  getApprovedSenders,
  getApprovedRecipients,
  transferOwnership,
} from "../services/blockchainService";
import {
  Chain,
  createPublicClient,
  decodeEventLog,
  http,
  recoverMessageAddress,
} from "viem";
import { TxHash } from "../models/txHash";

const RPC_URL = process.env.RPC_URL || process.env.VITE_RPC_URL || "";
export const CONTRACT_ADDRESS = (
  process.env.CONTRACT_ADDRESS ||
  process.env.VITE_CONTRACT_ADDRESS ||
  ""
).toLowerCase();

export function getPublicClient() {
  if (!RPC_URL)
    throw new Error("RPC_URL not configured (set RPC_URL or VITE_RPC_URL)");
  return createPublicClient({
    chain: { id: 84532, name: "base_sepolia" } as Chain,
    transport: http(RPC_URL),
  });
}

export async function approveSenderHandler(req: Request, res: Response) {
  try {
    const { address, approved } = req.body;
    console.log("approveSenderHandler", address, approved);
    if (!address || typeof approved !== "boolean")
      return res
        .status(400)
        .json({ error: "address and approved(boolean) required" });

    const result = await setApprovedSender(address, approved);
    console.log("txhash", result.txHash);

    // save to DB
    if (result.txHash) {
      await saveToDB("approveSender", result.txHash);
    }

    return res.json({ ok: true, result });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? String(err) });
  }
}

export async function approveRecipientHandler(req: Request, res: Response) {
  try {
    const { address, approved } = req.body;
    console.log("approveRecipientHandler", address, approved);
    if (!address || typeof approved !== "boolean")
      return res
        .status(400)
        .json({ error: "address and approved(boolean) required" });
    const result = await setApprovedRecipient(address, approved);
    console.log("txhash", result.txHash);

    if (result.txHash) {
      await saveToDB("approveRecipient", result.txHash);
    }

    return res.json({ ok: true, result });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? String(err) });
  }
}

export async function relayAddTransactionHandler(req: Request, res: Response) {
  try {
    const { payload, signature, signer } = req.body;
    if (!payload || !signature || !signer)
      return res.status(400).json({ error: "missing fields" });

    const message = JSON.stringify(payload);

    // recover address using viem
    let recovered: string;
    try {
      recovered = await recoverMessageAddress({
        message,
        signature,
      });
    } catch (e: any) {
      return res.status(400).json({ error: "invalid signature" });
    }

    if (recovered.toLowerCase() !== String(signer).toLowerCase()) {
      return res.status(400).json({ error: "signature does not match signer" });
    }

    // basic replay protection: only accept payloads newer than 5 minutes
    const now = Math.floor(Date.now() / 1000);
    if (!payload.date || Math.abs(now - Number(payload.date)) > 60 * 5) {
      return res.status(400).json({ error: "payload timestamp expired" });
    }

    // call your server-side relayer to submit tx (server signs & sends)
    const result = await addTransaction(
      payload.senderName,
      payload.to,
      payload.recipientName,
      BigInt(payload.amount), // ensure BigInt
      payload.currency,
      payload.purpose,
      payload.date
    );

    // normalize txHash
    const txHash =
      result?.txHash || result?.receipt?.transactionHash || undefined;

    // save to DB
    if (txHash) {
      await saveToDB(
        "addTransaction",
        txHash,
        Number(payload.amount),
        payload.currency,
        signer,
        payload.to
      );
    }

    // return serializable result (no DB side-effects here)
    return res.json({
      ok: true,
      txHash,
      result: convertBigInts(result),
    });
  } catch (err: any) {
    console.error("relayAddTransaction error:", err);
    return res.status(500).json({ error: err?.message ?? String(err) });
  }
}

export async function addTransactionHandler(req: Request, res: Response) {
  try {
    const { senderName, to, recipientName, amount, currency, purpose } =
      req.body;

    console.log("addTransactionHandler", req.body);

    if (!senderName || !to || !recipientName || typeof amount === "undefined")
      return res.status(400).json({ error: "missing fields" });

    const result = await addTransaction(
      senderName,
      to,
      recipientName,
      amount,
      currency,
      purpose
    );

    console.log("addTransaction result:", result);

    // normalize/unwrap tx hash from common shapes returned by service
    const txHash =
      result?.txHash || result?.receipt?.transactionHash || undefined;

    if (!txHash) {
      console.warn("addTransaction returned no txHash — not saving to DB");
    }

    console.log("txhash", result.txHash);

    // convert any BigInt fields to strings so JSON serialization succeeds
    const serializable = convertBigInts(result);

    return res.json({ ok: true, result: serializable, txHash });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? String(err) });
  }
}

export async function getTransactionHandler(req: Request, res: Response) {
  try {
    const idx = Number(req.params.index);
    if (Number.isNaN(idx))
      return res.status(400).json({ error: "invalid index" });

    const tx = await getTransaction(idx);

    return res.json({ ok: true, tx: convertBigInts(tx) });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? String(err) });
  }
}

export async function getTransactionCountHandler(_req: Request, res: Response) {
  try {
    const count = await getTransactionCount();
    return res.json({ ok: true, count });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? String(err) });
  }
}

export async function getApprovedSendersHandler(_req: Request, res: Response) {
  try {
    const list = await getApprovedSenders();
    return res.json({ ok: true, list });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? String(err) });
  }
}
export async function getApprovedRecipientsHandler(
  _req: Request,
  res: Response
) {
  try {
    const list = await getApprovedRecipients();
    return res.json({ ok: true, list });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? String(err) });
  }
}

export async function transferOwnershipHandler(req: Request, res: Response) {
  try {
    const { newOwner } = req.body;
    if (!newOwner) return res.status(400).json({ error: "newOwner required" });
    const result = await transferOwnership(newOwner);

    if (!result) throw new Error("transferOwnership failed");

    // save to DB
    if (result.txHash) {
      await saveToDB("transferOwnership", result.txHash);
    }

    return res.json({ ok: true, result });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? String(err) });
  }
}

export async function getTransactionsHandler(_req: Request, res: Response) {
  try {
    const transactions = await TxHash.find().sort({ createdAt: -1 }).limit(100);
    // normalize so missing fields become null (instead of omitted)
    const normalized = transactions.map((t: any) => ({
      type: t.type ?? null,
      txHash: t.txHash ?? null,
      amount: typeof t.amount !== "undefined" ? t.amount : null,
      currency: t.currency ?? null,
      from: t.from ?? null,
      to: t.to ?? null,
      createdAt: t.createdAt ?? null,
    }));
    return res.json({ ok: true, transactions: normalized });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return res.status(500).json({ error: "Failed to fetch transactions" });
  }
}

function convertBigInts(value: any): any {
  if (typeof value === "bigint") return value.toString();
  if (value === null) return null;
  if (Array.isArray(value)) return value.map(convertBigInts);
  if (typeof value === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = convertBigInts(v);
    }
    return out;
  }
  return value;
}

async function saveToDB(
  type: string,
  txHash: string,
  amount?: number,
  currency?: string,
  from?: string,
  to?: string
) {
  try {
    const newTx = await TxHash.create({
      type,
      txHash,
      amount,
      currency,
      from,
      to,
    });
    if (!newTx) throw new Error("Failed to save txHash to DB");
    return newTx;
  } catch (error) {
    console.error("Error saving txHash to DB:", error);
    return null;
  }
}
