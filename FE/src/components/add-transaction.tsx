import type React from "react";

import { useState } from "react";
import { Send, ArrowUpDown, Plus, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { signAndRelayTransaction } from "@/blockchain/signAndRelayTx";

const currency = [
  { symbol: "PHP", name: "Philippine Peso" },
  { symbol: "USD", name: "US Dollar" },
  { symbol: "EUR", name: "Euro" },
];

export default function AddTransaction({
  setStatus,
  refreshList,
}: {
  setStatus: React.Dispatch<React.SetStateAction<string>>;
  refreshList(): Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    recipient: "",
    senderName: "",
    amount: "",
    currency: "",
    recipientName: "",
    purpose: "",
  });
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setStatus("Requesting signature in wallet...");
    try {
      const res = await signAndRelayTransaction(
        "http://localhost:3000/api/blockchain/",
        {
          senderName: formData.senderName,
          to: formData.recipient,
          recipientName: formData.recipientName,
          amount: formData.amount,
          currency: formData.currency,
          purpose: formData.purpose,
        }
      );

      if (!res) throw new Error("No response from server");

      refreshList()
        .then(() => setStatus("Transaction successful!"))
        .catch(() => {});

      setFormData({
        recipient: "",
        senderName: "",
        amount: "",
        currency: "",
        recipientName: "",
        purpose: "",
      });
    } catch (err: any) {
      setStatus("Failed: " + (err?.message ?? String(err)));
    } finally {
      setLoading(false);
    }
  }

  const selectedCurrency = currency.find((t) => t.symbol === formData.currency);

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setFormData((prev) => ({ ...prev, recipient: text }));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to read clipboard:", err);
    }
  };

  const isFormValid =
    formData.recipient &&
    formData.amount &&
    formData.currency &&
    formData.recipientName &&
    formData.senderName &&
    formData.purpose;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label
            htmlFor="currency"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Currency
          </Label>
          <Select
            value={formData.currency}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, currency: value }))
            }
          >
            <SelectTrigger className="bg-gray-50 dark:bg-[#1A1A1E] border-gray-200 dark:border-[#2A2A2E]">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {currency.map((curr) => (
                <SelectItem key={curr.symbol} value={curr.symbol}>
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium">{curr.symbol}</span>
                    <span className="text-sm text-gray-500 ml-2 ml-2">
                      {curr.name}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="senderName"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Sender Name
          </Label>
          <Input
            id="senderName"
            type="text"
            value={formData.senderName}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, senderName: e.target.value }))
            }
            className="bg-gray-50 dark:bg-[#1A1A1E] border-gray-200 dark:border-[#2A2A2E]"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="recipientName"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Recipient Name
        </Label>
        <Input
          id="purpose"
          type="text"
          value={formData.recipientName}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, recipientName: e.target.value }))
          }
          className="bg-gray-50 dark:bg-[#1A1A1E] border-gray-200 dark:border-[#2A2A2E]"
        />
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="recipient"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Recipient Address
        </Label>
        <div className="relative">
          <Input
            id="recipient"
            type="text"
            placeholder="0x742d35Cc6634C0532925a3b8D4C9db96590c6C87"
            value={formData.recipient}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, recipient: e.target.value }))
            }
            className="bg-gray-50 dark:bg-[#1A1A1E] border-gray-200 dark:border-[#2A2A2E] pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={pasteFromClipboard}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label
            htmlFor="amount"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Amount
          </Label>
          <div className="relative">
            <Input
              id="amount"
              type="number"
              step="0.000001"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, amount: e.target.value }))
              }
              className="bg-gray-50 dark:bg-[#1A1A1E] border-gray-200 dark:border-[#2A2A2E] pr-16"
            />
            {selectedCurrency && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                {selectedCurrency.symbol}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="purpose"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Purpose
          </Label>
          <Input
            id="purpose"
            type="text"
            value={formData.purpose}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, purpose: e.target.value }))
            }
            className="bg-gray-50 dark:bg-[#1A1A1E] border-gray-200 dark:border-[#2A2A2E]"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-[#2A2A2E]">
        <Button
          type="submit"
          disabled={!isFormValid || loading}
          className=" px-8"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Transaction
            </div>
          )}
        </Button>
      </div>
    </form>
  );
}
