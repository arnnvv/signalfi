"use client";

import { useWallet } from "./WalletProvider";

export function ConnectWallet() {
  const {
    address,
    isCorrectNetwork,
    connectWallet,
    disconnectWallet,
    switchToArcologyNetwork,
  } = useWallet();

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        <h1 className="text-lg font-bold">Arc-Yellow Trader</h1>

        <div className="flex items-center gap-3">
          {address ? (
            <>
              {!isCorrectNetwork && (
                <button
                  onClick={switchToArcologyNetwork}
                  className="px-3 py-1.5 rounded-md text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white transition-colors"
                >
                  Switch Network
                </button>
              )}
              <span className="text-sm text-muted-foreground">
                {formatAddress(address)}
              </span>
              <button
                onClick={disconnectWallet}
                className="px-4 py-2 rounded-md font-semibold text-sm bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={connectWallet}
              className="px-4 py-2 rounded-md font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
