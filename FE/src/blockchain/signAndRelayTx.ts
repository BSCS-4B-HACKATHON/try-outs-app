export async function signAndRelayTransaction(
  apiBase: string,
  form: {
    senderName: string;
    to: string;
    recipientName: string;
    amount: string | number;
    currency?: string;
    purpose?: string;
  }
) {
  const provider = (window as any).ethereum;
  if (!provider) throw new Error("No injected wallet (window.ethereum)");
  await provider.request({ method: "eth_requestAccounts" });
  const accounts: string[] = await provider.request({ method: "eth_accounts" });
  const signer = accounts[0];

  const payload = {
    senderName: form.senderName,
    to: form.to,
    recipientName: form.recipientName,
    amount: String(form.amount),
    currency: form.currency || "",
    purpose: form.purpose || "",
    date: Math.floor(Date.now() / 1000), // timestamp for replay protection
  };

  const message = JSON.stringify(payload);

  // personal_sign is widely supported; for better UX use EIP-712 in production
  const signature = await provider.request({
    method: "personal_sign",
    params: [message, signer],
  });

  const res = await fetch(
    `${apiBase.replace(/\/$/, "")}/relay-add-transaction`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload, signature, signer }),
    }
  );

  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch (e) {
    // helpful error when HTML or other non-JSON returned
    throw new Error(
      `Unexpected response from relay endpoint: ${text.slice(0, 300)}`
    );
  }

  if (!res.ok) throw new Error(data?.error || JSON.stringify(data));
  return data; // expect { ok: true, txHash, receipt }
}
