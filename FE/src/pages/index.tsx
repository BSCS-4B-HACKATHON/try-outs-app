import React, { useEffect, useState } from "react";
import { connectWallet } from "../blockchain/contractActions";
import { signAndRelayTransaction } from "../blockchain/signAndRelayTx";
import TopNav from "@/components/top-nav";
import { Plus, Wallet } from "lucide-react";
import TransactionHistory from "@/components/transaction-history";
import AddTransaction from "@/components/add-transaction";

const CONTRACT_ADDRESS =
  (import.meta.env.VITE_CONTRACT_ADDRESS as string) || "";

export default function Index() {
  const [account, setAccount] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [txs, setTxs] = useState<{ txHash: string; type: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    senderName: "",
    to: "",
    recipientName: "",
    amount: "0",
    currency: "",
    purpose: "",
  });

  useEffect(() => {
    // reload txs
    async function loadTxs() {
      const res = await fetch(
        `http://localhost:3000/api/blockchain/transactions`
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || JSON.stringify(data));
      }

      setTxs(data.transactions);
    }
    loadTxs();
  }, []);

  useEffect(() => {
    // try to read connected account
    if (typeof window !== "undefined" && (window as any).ethereum) {
      (window as any).ethereum
        .request({ method: "eth_accounts" })
        .then((a: string[]) => {
          if (a && a.length) setAccount(a[0]);
        });
    }
    refreshList().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshList() {
    if (!CONTRACT_ADDRESS) return;
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:3000/api/blockchain/transactions`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || JSON.stringify(data));
      }

      setTxs(data.transactions);
    } catch (err: any) {
      console.error(err);
      setStatus(
        "Failed to load transactions: " + (err?.message ?? String(err))
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    try {
      const acc = await connectWallet();
      setAccount(acc);
      setStatus("Wallet connected: " + acc);
    } catch (err: any) {
      setStatus("Connect failed: " + (err?.message ?? String(err)));
    }
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setStatus("Requesting signature in wallet...");
    try {
      const res = await signAndRelayTransaction(
        "http://localhost:3000/api/blockchain/",
        {
          senderName: form.senderName,
          to: form.to,
          recipientName: form.recipientName,
          amount: form.amount,
          currency: form.currency,
          purpose: form.purpose,
        }
      );

      if (!res) throw new Error("No response from server");

      refreshList()
        .then(() => setStatus("Transaction successful!"))
        .catch(() => {});
    } catch (err: any) {
      setStatus("Failed: " + (err?.message ?? String(err)));
    }
  }

  return (
    <div className="flex h-screen">
      <div className="w-full flex flex-1 flex-col">
        <header className="h-16 border-b border-gray-200 dark:border-[#1F1F23]">
          <TopNav />
        </header>
        <main className="flex-1 overflow-auto p-6 bg-white dark:bg-[#0F0F12]">
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-6 flex flex-col border border-gray-200 dark:border-[#1F1F23]">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-left flex items-center gap-2 ">
                  <Wallet className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-50" />
                  Transaction History
                </h2>
                <TransactionHistory />
              </div>
              <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-6 flex flex-col border border-gray-200 dark:border-[#1F1F23]">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-left flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-50" />
                  Recent Transactions
                </h2>
                <AddTransaction />
              </div>
            </div>
          </div>
        </main>
      </div>
      {/* <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 className="text-2xl font-bold">IRL Ledger UI</h1>
        <div>
          {account ? (
            <span>Connected: {account}</span>
          ) : (
            <button onClick={handleConnect}>Connect Wallet</button>
          )}
        </div>
      </header>

      <section
        style={{
          marginTop: 20,
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 6,
        }}
      >
        <h2>Add Transaction</h2>
        <form onSubmit={handleSubmit}>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
          >
            <input
              placeholder="Sender name"
              value={form.senderName}
              onChange={(e) => setForm({ ...form, senderName: e.target.value })}
            />
            <input
              placeholder="Recipient address (0x...)"
              value={form.to}
              onChange={(e) => setForm({ ...form, to: e.target.value })}
            />
            <input
              placeholder="Recipient name"
              value={form.recipientName}
              onChange={(e) =>
                setForm({ ...form, recipientName: e.target.value })
              }
            />
            <input
              placeholder="Amount (integer)"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
            <input
              placeholder="Currency"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
            />
            <input
              placeholder="Purpose"
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <button type="submit" disabled={!account}>
              Send Transaction
            </button>
            <button
              type="button"
              onClick={() => refreshList()}
              style={{ marginLeft: 8 }}
            >
              Refresh List
            </button>
          </div>
        </form>
        <p style={{ marginTop: 8 }}>{status}</p>
      </section>

      <section style={{ marginTop: 20 }}>
        <h2>Transactions ({txs.length})</h2>
        {loading ? (
          <p>Loading…</p>
        ) : txs.length === 0 ? (
          <p>No transactions found</p>
        ) : (
          <ul>
            {txs.map((link, idx) => (
              <li key={idx} style={{ marginBottom: 8 }}>
                <a
                  href={`https://sepolia.basescan.org/tx/${link.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  [ {link.type} ] transaction: {link.txHash}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section> */}
    </div>
  );
}
