"use client";

import { cn } from "@/lib/utils";
import { useWallet } from "./WalletProvider";

export function ConnectWallet() {
  const { address, connectWallet } = useWallet();

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        <h1 className="text-lg font-bold">Arc-Yellow Trader</h1>
        <button
          onClick={connectWallet}
          disabled={!!address}
          className={cn(
            "px-4 py-2 rounded-md font-semibold text-sm transition-colors",
            address
              ? "bg-green-600 text-white cursor-default"
              : "bg-blue-600 hover:bg-blue-700 text-white",
          )}
        >
          {address ? `Connected: ${formatAddress(address)}` : "Connect Wallet"}
        </button>
      </div>
    </header>
  );
}
