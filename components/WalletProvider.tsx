"use client";

import { ethers } from "ethers";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { toast } from "sonner";

interface WalletContextType {
  address: string | null;
  signer: ethers.JsonRpcSigner | null;
  connectWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);

  const connectWallet = useCallback(async () => {
    if (typeof window.ethereum === "undefined") {
      toast.error(
        "MetaMask is not installed. Please install it to use this dApp.",
      );
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signerInstance = await provider.getSigner();
      const userAddress = await signerInstance.getAddress();

      setSigner(signerInstance);
      setAddress(userAddress);
      toast.success("Wallet Connected!", {
        description: `${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}`,
      });
    } catch (err) {
      console.error("Failed to connect wallet:", err);
      toast.error("Failed to connect wallet", {
        description: "The request was rejected by the user.",
      });
    }
  }, []);

  return (
    <WalletContext.Provider value={{ address, signer, connectWallet }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
