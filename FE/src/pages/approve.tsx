import React, { useEffect, useState } from "react";

const API_BASE = (import.meta.env.VITE_API_BASE as string) || ""; // e.g. http://localhost:3000
const ADMIN_KEY = (import.meta.env.VITE_ADMIN_API_KEY as string) || ""; // DO NOT commit a real secret to git

type Addr = string;

export default function AdminApprovals() {
  const [senders, setSenders] = useState<Addr[]>([]);
  const [recipients, setRecipients] = useState<Addr[]>([]);
  const [addr, setAddr] = useState("");
  const [isSender, setIsSender] = useState(true);
  const [approved, setApproved] = useState(true);
  const [status, setStatus] = useState("");

  useEffect(() => {
    refresh();
  }, []);

  async function apiFetch(path: string, opts?: RequestInit) {
    const headers = {
      "Content-Type": "application/json",
      ...(opts?.headers || {}),
    } as Record<string, string>;
    if (ADMIN_KEY) headers["x-api-key"] = ADMIN_KEY;
    const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async function refresh() {
    try {
      setStatus("Loading...");
      const s = await apiFetch("/api/blockchain/approved-senders");
      const r = await apiFetch("/api/blockchain/approved-recipients");
      setSenders(Array.isArray(s.list) ? s.list : []);
      setRecipients(Array.isArray(r.list) ? r.list : []);
      setStatus("");
    } catch (e: any) {
      setStatus("Refresh failed: " + (e?.message ?? String(e)));
    }
  }

  async function submitApproval(e?: React.FormEvent) {
    e?.preventDefault();
    if (!addr) return setStatus("Address required");
    try {
      setStatus("Sending...");
      const path = isSender
        ? "/api/blockchain/approve-sender"
        : "/api/blockchain/approve-recipient";
      await apiFetch(`http://localhost:3000${path}`, {
        method: "POST",
        body: JSON.stringify({ address: addr, approved }),
      });
      setStatus("OK");
      setAddr("");
      await refresh();
    } catch (err: any) {
      setStatus("Error: " + (err?.message ?? String(err)));
    }
  }

  async function toggleApprove(
    targetAddr: string,
    kindIsSender: boolean,
    makeApproved: boolean
  ) {
    try {
      setStatus("Sending...");
      const path = kindIsSender
        ? "/api/blockchain/approve-sender"
        : "/api/blockchain/approve-recipient";
      await apiFetch(path, {
        method: "POST",
        body: JSON.stringify({ address: targetAddr, approved: makeApproved }),
      });
      setStatus("OK");
      await refresh();
    } catch (err: any) {
      setStatus("Error: " + (err?.message ?? String(err)));
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: 24, fontFamily: "sans-serif" }}>
      <h1>Admin — Approve Senders & Recipients</h1>

      <form
        onSubmit={submitApproval}
        style={{
          marginBottom: 16,
          padding: 12,
          border: "1px solid #ddd",
          borderRadius: 6,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <label>
            <input
              type="radio"
              checked={isSender}
              onChange={() => setIsSender(true)}
            />{" "}
            Sender
          </label>
          <label>
            <input
              type="radio"
              checked={!isSender}
              onChange={() => setIsSender(false)}
            />{" "}
            Recipient
          </label>

          <input
            placeholder="0x..."
            value={addr}
            onChange={(e) => setAddr(e.target.value)}
            style={{ flex: 1, minWidth: 260 }}
          />

          <label>
            <input
              type="checkbox"
              checked={approved}
              onChange={(e) => setApproved(e.target.checked)}
            />{" "}
            Approve
          </label>

          <button type="submit">Submit</button>
          <button type="button" onClick={refresh}>
            Refresh lists
          </button>
        </div>
        <div style={{ marginTop: 8, color: "#666" }}>
          Note: backend must accept requests at /api/blockchain/approve-sender
          and /approve-recipient.
        </div>
      </form>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <section
          style={{ border: "1px solid #eee", padding: 12, borderRadius: 6 }}
        >
          <h3>Approved Senders ({senders.length})</h3>
          {senders.length === 0 ? (
            <p>None</p>
          ) : (
            <ul>
              {senders.map((s) => (
                <li
                  key={s}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <span style={{ fontFamily: "monospace" }}>{s}</span>
                  <div>
                    <button onClick={() => toggleApprove(s, true, false)}>
                      Revoke
                    </button>
                    <button
                      onClick={() => toggleApprove(s, true, true)}
                      style={{ marginLeft: 8 }}
                    >
                      Re-approve
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          style={{ border: "1px solid #eee", padding: 12, borderRadius: 6 }}
        >
          <h3>Approved Recipients ({recipients.length})</h3>
          {recipients.length === 0 ? (
            <p>None</p>
          ) : (
            <ul>
              {recipients.map((r) => (
                <li
                  key={r}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <span style={{ fontFamily: "monospace" }}>{r}</span>
                  <div>
                    <button onClick={() => toggleApprove(r, false, false)}>
                      Revoke
                    </button>
                    <button
                      onClick={() => toggleApprove(r, false, true)}
                      style={{ marginLeft: 8 }}
                    >
                      Re-approve
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <p style={{ marginTop: 12, color: "#b000" }}>{status}</p>
    </div>
  );
}
