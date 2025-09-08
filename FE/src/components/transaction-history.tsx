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
  id: string;
  hash: string;
  type: "send" | "receive" | "swap" | "approve";
  status: "confirmed" | "pending" | "failed";
  from: string;
  to: string;
  amount: string;
  token: string;
  tokenSymbol: string;
  gasUsed: string;
  gasPrice: string;
  blockNumber: number;
  confirmations: number;
  timestamp: Date;
  network: string;
}

// Mock transaction data
const mockTransactions: Transaction[] = [
  {
    id: "1",
    hash: "0x1234567890abcdef1234567890abcdef12345678",
    type: "receive",
    status: "confirmed",
    from: "0xabcdef1234567890abcdef1234567890abcdef12",
    to: "0x1234567890abcdef1234567890abcdef12345678",
    amount: "2.5",
    token: "ETH",
    tokenSymbol: "ETH",
    gasUsed: "21000",
    gasPrice: "20",
    blockNumber: 18500000,
    confirmations: 12,
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    network: "Ethereum",
  },
  {
    id: "2",
    hash: "0xabcdef1234567890abcdef1234567890abcdef12",
    type: "send",
    status: "confirmed",
    from: "0x1234567890abcdef1234567890abcdef12345678",
    to: "0xfedcba0987654321fedcba0987654321fedcba09",
    amount: "1000",
    token: "USDC",
    tokenSymbol: "USDC",
    gasUsed: "65000",
    gasPrice: "25",
    blockNumber: 18499950,
    confirmations: 25,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    network: "Ethereum",
  },
  {
    id: "4",
    hash: "0xfedcba0987654321fedcba0987654321fedcba09",
    type: "approve",
    status: "failed",
    from: "0x1234567890abcdef1234567890abcdef12345678",
    to: "0x1111111111111111111111111111111111111111",
    amount: "∞",
    token: "USDC",
    tokenSymbol: "USDC",
    gasUsed: "0",
    gasPrice: "20",
    blockNumber: 0,
    confirmations: 0,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
    network: "Ethereum",
  },
];

const truncateAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const truncateHash = (hash: string) => {
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
};

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
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
    case "send":
      return <ArrowUpRight className="w-4 h-4 text-red-500" />;
    case "receive":
      return <ArrowDownLeft className="w-4 h-4 text-green-500" />;
    case "swap":
      return <RefreshCw className="w-4 h-4 text-blue-500" />;
    case "approve":
      return <CheckCircle className="w-4 h-4 text-purple-500" />;
    default:
      return <ArrowUpRight className="w-4 h-4 text-gray-500" />;
  }
};

const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diffInMinutes = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60)
  );

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
};

export default function TransactionHistory() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-[#1F1F23] bg-white dark:bg-zinc-900/70 shadow-sm">
      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="p-4 space-y-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
        >
          {mockTransactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-3 rounded-lg  border border-gray-200 dark:border-[#212125] hover:bg-gray-50 dark:hover:bg-[#111113] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {getTypeIcon(tx.type)}
                  {getStatusIcon(tx.status)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {tx.type}
                    </span>
                    <Badge
                      variant={
                        tx.status === "confirmed"
                          ? "default"
                          : tx.status === "pending"
                          ? "secondary"
                          : "destructive"
                      }
                      className="text-xs"
                    >
                      {tx.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <button
                      onClick={() => copyToClipboard(tx.hash)}
                      className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {truncateHash(tx.hash)}
                      <Copy className="w-3 h-3" />
                    </button>
                    <span>•</span>
                    <span>{formatTimeAgo(tx.timestamp)}</span>
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
                  {tx.type === "send" ? "-" : tx.type === "receive" ? "+" : ""}
                  {tx.amount} {tx.tokenSymbol}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Gas:{" "}
                  {(Number.parseFloat(tx.gasUsed) *
                    Number.parseFloat(tx.gasPrice)) /
                    1e9}{" "}
                  ETH
                </div>
                <button className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1">
                  View on Explorer
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
