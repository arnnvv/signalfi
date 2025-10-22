"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { toast } from "sonner";
import { useWallet } from "./WalletProvider";
import {
  CONTRACTS,
  ERC20_ABI,
  SETTLEMENT_ABI,
  USDC_DECIMALS,
} from "@/lib/config";

export function Deposit() {
  const { signer, address, isCorrectNetwork } = useWallet();
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState("0");
  const [allowance, setAllowance] = useState("0");
  const [depositBalance, setDepositBalance] = useState("0");
  const [isApproving, setIsApproving] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);

  const loadBalances = async (retryCount = 0) => {
    if (!signer || !address) return;

    try {
      const usdcContract = new ethers.Contract(
        CONTRACTS.USDC,
        ERC20_ABI,
        signer,
      );
      const settlementContract = new ethers.Contract(
        CONTRACTS.SETTLEMENT,
        SETTLEMENT_ABI,
        signer,
      );

      const bal = await usdcContract.balanceOf(address);
      setBalance(ethers.formatUnits(bal, USDC_DECIMALS));

      await new Promise((resolve) => setTimeout(resolve, 100));

      const allow = await usdcContract.allowance(address, CONTRACTS.SETTLEMENT);
      setAllowance(ethers.formatUnits(allow, USDC_DECIMALS));

      await new Promise((resolve) => setTimeout(resolve, 100));

      const depBal = await settlementContract.getDeposit(address);
      setDepositBalance(ethers.formatUnits(depBal, USDC_DECIMALS));
    } catch (err: any) {
      console.error("Error loading balances:", err);

      if (err.message?.includes("circuit breaker") && retryCount < 2) {
        console.log(
          `Circuit breaker detected, retrying in 2 seconds... (attempt ${retryCount + 1})`,
        );
        toast.info("MetaMask rate limit detected. Retrying...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return loadBalances(retryCount + 1);
      }

      toast.error(
        "Failed to load balances. Please reset MetaMask account or try again later.",
      );
    }
  };

  useEffect(() => {
    if (signer && address && isCorrectNetwork) {
      loadBalances();
    }
  }, [signer, address, isCorrectNetwork]);

  const handleApprove = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!isCorrectNetwork) {
      toast.error("Please switch to Arcology Devnet");
      return;
    }

    setIsApproving(true);
    const toastId = toast.loading("Approving USDC...");

    try {
      const usdcContract = new ethers.Contract(
        CONTRACTS.USDC,
        ERC20_ABI,
        signer,
      );
      const amountInWei = ethers.parseUnits(amount, USDC_DECIMALS);

      const tx = await usdcContract.approve(CONTRACTS.SETTLEMENT, amountInWei);
      toast.loading("Waiting for approval confirmation...", { id: toastId });

      await tx.wait();
      toast.success("USDC approved successfully!", { id: toastId });
      await loadBalances();
    } catch (err: any) {
      console.error("Approval error:", err);
      toast.error("Failed to approve USDC", {
        id: toastId,
        description: err.message || "Unknown error",
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (parseFloat(amount) > parseFloat(balance)) {
      toast.error("Insufficient USDC balance");
      return;
    }

    if (parseFloat(amount) > parseFloat(allowance)) {
      toast.error("Please approve USDC first");
      return;
    }

    if (!isCorrectNetwork) {
      toast.error("Please switch to Arcology Devnet");
      return;
    }

    setIsDepositing(true);
    const toastId = toast.loading("Depositing USDC...");

    try {
      const settlementContract = new ethers.Contract(
        CONTRACTS.SETTLEMENT,
        SETTLEMENT_ABI,
        signer,
      );
      const amountInWei = ethers.parseUnits(amount, USDC_DECIMALS);

      const tx = await settlementContract.deposit(amountInWei);
      toast.loading("Waiting for deposit confirmation...", { id: toastId });

      await tx.wait();
      toast.success("USDC deposited successfully!", { id: toastId });
      setAmount("");
      await loadBalances();
    } catch (err: any) {
      console.error("Deposit error:", err);
      toast.error("Failed to deposit USDC", {
        id: toastId,
        description: err.message || "Unknown error",
      });
    } finally {
      setIsDepositing(false);
    }
  };

  const handleMaxClick = () => {
    setAmount(balance);
  };

  if (!address) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border p-6">
        <h2 className="text-xl font-semibold">1. Deposit USDC</h2>
        <p className="text-muted-foreground text-sm text-center py-4">
          Please connect your wallet to deposit USDC
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-6">
      <h2 className="text-xl font-semibold">1. Deposit USDC</h2>

      {!isCorrectNetwork && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 text-sm text-orange-600 dark:text-orange-400">
          ⚠️ Wrong Network - Please switch to Arcology Devnet
        </div>
      )}

      <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Wallet Balance:</span>
          <span className="font-semibold">
            {parseFloat(balance).toFixed(2)} USDC
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Allowance:</span>
          <span className="font-semibold">
            {parseFloat(allowance).toFixed(2)} USDC
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Deposited:</span>
          <span className="font-semibold">
            {parseFloat(depositBalance).toFixed(2)} USDC
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Amount (USDC)</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="flex-1 p-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={isApproving || isDepositing || !isCorrectNetwork}
          />
          <button
            onClick={handleMaxClick}
            disabled={isApproving || isDepositing || !isCorrectNetwork}
            className="px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            MAX
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleApprove}
          disabled={isApproving || isDepositing || !amount || !isCorrectNetwork}
          className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isApproving ? "Approving..." : "Approve USDC"}
        </button>

        <button
          onClick={handleDeposit}
          disabled={isDepositing || isApproving || !amount || !isCorrectNetwork}
          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isDepositing ? "Depositing..." : "Deposit USDC"}
        </button>
      </div>

      <p className="text-muted-foreground text-xs">
        Enter the amount of USDC to deposit into the settlement contract on
        Arcology Devnet.
      </p>
    </div>
  );
}
