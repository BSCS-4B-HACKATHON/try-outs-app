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

const tokens = [
  { symbol: "ETH", name: "Ethereum", balance: "2.45" },
  { symbol: "USDC", name: "USD Coin", balance: "1,250.00" },
  { symbol: "USDT", name: "Tether", balance: "500.00" },
  { symbol: "DAI", name: "Dai Stablecoin", balance: "750.25" },
];

const transactionTypes = [
  { value: "send", label: "Send", icon: Send },
  { value: "receive", label: "Receive", icon: ArrowUpDown },
];

export default function AddTransaction() {
  const [formData, setFormData] = useState({
    type: "",
    recipient: "",
    amount: "",
    token: "",
    gasPrice: "21",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const selectedToken = tokens.find((t) => t.symbol === formData.token);
  const estimatedGasFee = (
    Number.parseFloat(formData.gasPrice) * 0.000021
  ).toFixed(6);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate transaction submission
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Reset form
    setFormData({
      type: "",
      recipient: "",
      amount: "",
      token: "",
      gasPrice: "21",
    });
    setIsSubmitting(false);
  };

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
    formData.type && formData.recipient && formData.amount && formData.token;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label
            htmlFor="type"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Transaction Type
          </Label>
          <Select
            value={formData.type}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, type: value }))
            }
          >
            <SelectTrigger className="bg-gray-50 dark:bg-[#1A1A1E] border-gray-200 dark:border-[#2A2A2E]">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {transactionTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="token"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Token
          </Label>
          <Select
            value={formData.token}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, token: value }))
            }
          >
            <SelectTrigger className="bg-gray-50 dark:bg-[#1A1A1E] border-gray-200 dark:border-[#2A2A2E]">
              <SelectValue placeholder="Select token" />
            </SelectTrigger>
            <SelectContent>
              {tokens.map((token) => (
                <SelectItem key={token.symbol} value={token.symbol}>
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium">{token.symbol}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      Balance: {token.balance}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
            {selectedToken && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                {selectedToken.symbol}
              </span>
            )}
          </div>
          {selectedToken && (
            <p className="text-xs text-gray-500">
              Available: {selectedToken.balance} {selectedToken.symbol}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="gasPrice"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Gas Price (Gwei)
          </Label>
          <Input
            id="gasPrice"
            type="number"
            value={formData.gasPrice}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, gasPrice: e.target.value }))
            }
            className="bg-gray-50 dark:bg-[#1A1A1E] border-gray-200 dark:border-[#2A2A2E]"
          />
          <p className="text-xs text-gray-500">
            Estimated fee: ~{estimatedGasFee} ETH
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-[#2A2A2E]">
        <Button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className=" px-8"
        >
          {isSubmitting ? (
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
