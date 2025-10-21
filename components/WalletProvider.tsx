"use client";

import { ethers } from "ethers";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from "react";
import { toast } from "sonner";

interface WalletContextType {
  address: string | null;
  signer: ethers.JsonRpcSigner | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const STORAGE_KEY = "wallet_connected";

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

      localStorage.setItem(STORAGE_KEY, "true");

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

  const disconnectWallet = useCallback(() => {
    setSigner(null);
    setAddress(null);
    localStorage.removeItem(STORAGE_KEY);
    toast.info("Wallet Disconnected");
  }, []);

  useEffect(() => {
    const autoConnect = async () => {
      if (typeof window.ethereum === "undefined") return;

      const wasConnected = localStorage.getItem(STORAGE_KEY);
      if (!wasConnected) return;

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_accounts", []);

        if (accounts.length > 0) {
          const signerInstance = await provider.getSigner();
          const userAddress = await signerInstance.getAddress();

          setSigner(signerInstance);
          setAddress(userAddress);

          console.log("Auto-connected to wallet:", userAddress);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (err) {
        console.error("Auto-connect failed:", err);
        localStorage.removeItem(STORAGE_KEY);
      }
    };

    autoConnect();
  }, []);

  useEffect(() => {
    if (typeof window.ethereum === "undefined") return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== address) {
        connectWallet();
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    const ethereum = window.ethereum;

    ethereum.on("accountsChanged", handleAccountsChanged);
    ethereum.on("chainChanged", handleChainChanged);

    return () => {
      ethereum.removeListener("accountsChanged", handleAccountsChanged);
      ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [address, connectWallet, disconnectWallet]);

  return (
    <WalletContext.Provider
      value={{ address, signer, connectWallet, disconnectWallet }}
    >
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
