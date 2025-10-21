"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { toast } from "sonner";
import SettlementContractABI from "@/abi/SettlementContract.json";
import { useWallet } from "./WalletProvider";

const SETTLEMENT_CONTRACT_ADDRESS =
  "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
const USDC_CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const USDC_DECIMALS = 6;

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)",
  "function name() external view returns (string)",
];

export function Deposit() {
  const { signer, address } = useWallet();
  const [amount, setAmount] = useState("");

  const handleDeposit = async () => {
    if (!signer || !address) {
      toast.error("Please connect your wallet first.");
      return;
    }
    const depositAmount = parseFloat(amount);
    if (!depositAmount || depositAmount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    const toastId = toast.loading("Preparing USDC deposit...");

    try {
      const usdcContract = new ethers.Contract(
        USDC_CONTRACT_ADDRESS,
        ERC20_ABI,
        signer,
      );
      const settlementContract = new ethers.Contract(
        SETTLEMENT_CONTRACT_ADDRESS,
        SettlementContractABI.abi,
        signer,
      );

      const amountInSmallestUnit = ethers.parseUnits(amount, USDC_DECIMALS);

      toast.info("Checking USDC balance...", { id: toastId });
      try {
        const balance = await usdcContract.balanceOf(address);
        console.log(
          "USDC Balance:",
          ethers.formatUnits(balance, USDC_DECIMALS),
        );

        if (balance < amountInSmallestUnit) {
          toast.error("Insufficient USDC balance", {
            id: toastId,
            description: `You only have ${ethers.formatUnits(balance, USDC_DECIMALS)} USDC`,
          });
          return;
        }
      } catch (balanceError) {
        console.error("Error checking balance:", balanceError);
        toast.error("Failed to check USDC balance", {
          id: toastId,
          description: "Make sure the USDC contract address is correct",
        });
        return;
      }

      toast.info("Checking USDC allowance...", { id: toastId });
      let currentAllowance;
      try {
        currentAllowance = await usdcContract.allowance(
          address,
          SETTLEMENT_CONTRACT_ADDRESS,
        );
        console.log(
          "Current Allowance:",
          ethers.formatUnits(currentAllowance, USDC_DECIMALS),
        );
      } catch (allowanceError) {
        console.error("Error checking allowance:", allowanceError);
        toast.error("Failed to check allowance", {
          id: toastId,
          description: "The USDC contract may not be deployed correctly",
        });
        return;
      }

      if (currentAllowance < amountInSmallestUnit) {
        toast.info("Please approve USDC spending in your wallet.", {
          id: toastId,
        });
        try {
          const approveTx = await usdcContract.approve(
            SETTLEMENT_CONTRACT_ADDRESS,
            amountInSmallestUnit,
          );
          console.log("Approve TX:", approveTx.hash);

          toast.loading("Waiting for approval confirmation...", {
            id: toastId,
          });
          const approveReceipt = await approveTx.wait();
          console.log("Approve Receipt:", approveReceipt);

          toast.success("Approval successful! Now confirming deposit...", {
            id: toastId,
          });
        } catch (approveError) {
          console.error("Approval failed:", approveError);
          throw approveError;
        }
      } else {
        console.log("Sufficient allowance already exists");
      }

      toast.loading("Sending deposit transaction...", { id: toastId });
      try {
        const depositTx =
          await settlementContract.deposit(amountInSmallestUnit);
        console.log("Deposit TX:", depositTx.hash);

        toast.loading("Waiting for deposit confirmation...", { id: toastId });
        const depositReceipt = await depositTx.wait();
        console.log("Deposit Receipt:", depositReceipt);

        toast.success("Deposit Successful!", {
          id: toastId,
          description: `Successfully deposited ${amount} USDC.`,
        });
        setAmount("");
      } catch (depositError) {
        console.error("Deposit transaction failed:", depositError);
        throw depositError;
      }
    } catch (err: unknown) {
      console.error("Deposit failed:", err);
      let errorMessage = "An unknown error occurred";

      if (typeof err === "object" && err !== null) {
        const e = err as { code?: string; reason?: string; message?: string };

        if (e.code === "ACTION_REJECTED") {
          errorMessage = "User rejected the transaction";
        } else if (e.reason) {
          errorMessage = e.reason;
        } else if (e.message) {
          errorMessage = e.message;
        }
      } else if (typeof err === "string") {
        errorMessage = err;
      }

      toast.error("Deposit Failed", {
        id: toastId,
        description: errorMessage,
      });
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-6">
      <h2 className="text-xl font-semibold">1. Deposit USDC</h2>
      <p className="text-muted-foreground text-sm">
        Enter the amount of USDC to deposit into the settlement contract.
      </p>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="e.g., 100 USDC"
        className="w-full p-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
        disabled={!signer}
      />
      <button
        onClick={handleDeposit}
        disabled={!signer}
        className="w-full px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-semibold disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
      >
        Deposit USDC
      </button>
    </div>
  );
}
