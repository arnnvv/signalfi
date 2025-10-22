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
import { NETWORK_CONFIG } from "@/lib/config";

interface WalletContextType {
  address: string | null;
  signer: ethers.JsonRpcSigner | null;
  provider: ethers.BrowserProvider | null;
  chainId: number | null;
  isCorrectNetwork: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchToArcologyNetwork: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const STORAGE_KEY = "wallet_connected";

function createArcologyProvider(ethereumProvider: any, account: string) {
  const provider = new ethers.BrowserProvider(ethereumProvider);

  const originalCall = provider.call.bind(provider);
  provider.call = async function (transaction: any) {
    if (!transaction.from && account) {
      transaction = {
        ...transaction,
        from: account,
      };
    }
    return originalCall(transaction);
  };

  return provider;
}

async function createArcologySigner(ethereumProvider: any, account: string) {
  const provider = createArcologyProvider(ethereumProvider, account);
  const signer = await provider.getSigner();

  const originalEstimateGas = signer.estimateGas.bind(signer);
  signer.estimateGas = async function (transaction: any) {
    if (!transaction.from) {
      transaction = {
        ...transaction,
        from: account,
      };
    }
    return originalEstimateGas(transaction);
  };

  return signer;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  const isCorrectNetwork = chainId === NETWORK_CONFIG.chainId;

  const switchToArcologyNetwork = useCallback(async () => {
    if (typeof window.ethereum === "undefined") return;

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: NETWORK_CONFIG.chainIdHex }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: NETWORK_CONFIG.chainIdHex,
                chainName: NETWORK_CONFIG.chainName,
                nativeCurrency: NETWORK_CONFIG.nativeCurrency,
                rpcUrls: [NETWORK_CONFIG.rpcUrl],
                blockExplorerUrls: NETWORK_CONFIG.blockExplorerUrl
                  ? [NETWORK_CONFIG.blockExplorerUrl]
                  : [],
              },
            ],
          });
        } catch (addError) {
          throw new Error("Failed to add Arcology network to MetaMask");
        }
      } else {
        throw switchError;
      }
    }
  }, []);

  const connectWallet = useCallback(async () => {
    if (typeof window.ethereum === "undefined") {
      toast.error(
        "MetaMask is not installed. Please install it to use this dApp.",
      );
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const web3Provider = createArcologyProvider(window.ethereum, accounts[0]);
      const web3Signer = await createArcologySigner(
        window.ethereum,
        accounts[0],
      );
      const network = await web3Provider.getNetwork();

      if (Number(network.chainId) !== NETWORK_CONFIG.chainId) {
        await switchToArcologyNetwork();
        const newProvider = createArcologyProvider(
          window.ethereum,
          accounts[0],
        );
        const newSigner = await createArcologySigner(
          window.ethereum,
          accounts[0],
        );
        const newNetwork = await newProvider.getNetwork();
        setProvider(newProvider);
        setSigner(newSigner);
        setChainId(Number(newNetwork.chainId));
      } else {
        setProvider(web3Provider);
        setSigner(web3Signer);
        setChainId(Number(network.chainId));
      }

      setAddress(accounts[0]);
      localStorage.setItem(STORAGE_KEY, "true");

      toast.success("Wallet Connected!", {
        description: `${accounts[0].substring(0, 6)}...${accounts[0].substring(accounts[0].length - 4)}`,
      });
    } catch (err) {
      console.error("Failed to connect wallet:", err);
      toast.error("Failed to connect wallet", {
        description: "The request was rejected by the user.",
      });
    }
  }, [switchToArcologyNetwork]);

  const disconnectWallet = useCallback(() => {
    setSigner(null);
    setAddress(null);
    setProvider(null);
    setChainId(null);
    localStorage.removeItem(STORAGE_KEY);
    toast.info("Wallet Disconnected");
  }, []);

  useEffect(() => {
    const autoConnect = async () => {
      if (typeof window.ethereum === "undefined") return;

      const wasConnected = localStorage.getItem(STORAGE_KEY);
      if (!wasConnected) return;

      try {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });

        if (accounts.length > 0) {
          const web3Provider = createArcologyProvider(
            window.ethereum,
            accounts[0],
          );
          const web3Signer = await createArcologySigner(
            window.ethereum,
            accounts[0],
          );
          const network = await web3Provider.getNetwork();

          setProvider(web3Provider);
          setSigner(web3Signer);
          setAddress(accounts[0]);
          setChainId(Number(network.chainId));

          console.log("Auto-connected to wallet:", accounts[0]);
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
      value={{
        address,
        signer,
        provider,
        chainId,
        isCorrectNetwork,
        connectWallet,
        disconnectWallet,
        switchToArcologyNetwork,
      }}
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
