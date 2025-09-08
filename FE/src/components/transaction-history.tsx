import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle,
  Clock,
  Copy,
  ExternalLink,
  RefreshCw,
  XCircle,
} from "lucide-react";

import { Badge } from "./ui/badge";
import { useEffect, useRef, useState } from "react";

interface Transaction {
  txHash: string;
  type:
    | "approveSender"
    | "approveRecipient"
    | "transferOwnership"
    | "addTransaction";
  amount: number;
  currency: string;
  from: string;
  to: string;
  createdAt: Date;
}

const truncateAddress = (address?: string) => {
  if (!address) return "—";
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const truncateHash = (hash?: string) => {
  if (!hash) return "—";
  if (hash.length <= 18) return hash;
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
};

const copyToClipboard = (text?: string) => {
  if (!text) return;
  try {
    navigator.clipboard?.writeText(String(text));
  } catch {
    /* ignore clipboard errors */
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "confirmed":
      return <CheckCircle className="w-3.5 h-3.5 text-green-500" />;
    case "pending":
      return <Clock className="w-3.5 h-3.5 text-yellow-500" />;
    case "failed":
      return <XCircle className="w-3.5 h-3.5 text-red-500" />;
    default:
      return <Clock className="w-3.5 h-3.5 text-gray-500" />;
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case "addTransaction":
      return <ArrowDownLeft className="w-4 h-4 text-green-500" />;
    case "transferOwnership":
      return <ArrowUpRight className="w-4 h-4 text-red-500" />;
    case "approveSender":
      return <RefreshCw className="w-4 h-4 text-blue-500" />;
    case "approveRecipient":
      return <CheckCircle className="w-4 h-4 text-purple-500" />;
    default:
      return <ArrowUpRight className="w-4 h-4 text-gray-500" />;
  }
};

const formatTimeAgo = (dateInput: Date | string | number) => {
  const date =
    dateInput instanceof Date
      ? dateInput
      : typeof dateInput === "number"
      ? new Date(dateInput)
      : new Date(String(dateInput));

  if (Number.isNaN(date.getTime())) return "Unknown";

  const now = new Date();
  const diffInMinutes = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60)
  );

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
};

export default function TransactionHistory({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-[#1F1F23] bg-white dark:bg-zinc-900/70 shadow-sm">
      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="p-4 space-y-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
        >
          {transactions?.map((tx) => (
            <div
              key={tx.txHash}
              className="flex items-center justify-between p-3 rounded-lg  border border-gray-200 dark:border-[#212125] hover:bg-gray-50 dark:hover:bg-[#111113] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {getTypeIcon(tx.type)}
                  {getStatusIcon("confirmed")}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {tx.type}
                    </span>
                    <Badge variant={"default"} className="text-xs">
                      {"confirmed"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <button
                      onClick={() => copyToClipboard(tx.txHash)}
                      className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {truncateHash(tx.txHash)}
                      <Copy className="w-3 h-3" />
                    </button>
                    <span>•</span>
                    <span>{formatTimeAgo(tx.createdAt)}</span>
                  </div>

                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <span>From: </span>
                    <button
                      onClick={() => copyToClipboard(tx.from)}
                      className="hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {truncateAddress(tx.from)}
                    </button>
                    <span> → To: </span>
                    <button
                      onClick={() => copyToClipboard(tx.to)}
                      className="hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {truncateAddress(tx.to)}
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-right space-y-1">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {tx.amount} {tx.currency}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  BSCS 4B
                </div>
                <a
                  href={`https://sepolia.basescan.org/tx/${tx.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
                >
                  View on Explorer
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
