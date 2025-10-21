"use client";

import { toast } from "sonner";
import { useWallet } from "./WalletProvider";
import { postCommand } from "@/lib/apiClient";

export function Follow() {
  const { signer, address } = useWallet();

  const handleFollow = async () => {
    if (!signer || !address) {
      toast.error("Please connect your wallet first.");
      return;
    }

    const toastId = toast.loading("Waiting for signature...");

    try {
      const messageToSign =
        "I authorize Arc-Yellow Trader to execute copy trades on my behalf.";
      const signature = await signer.signMessage(messageToSign);

      toast.loading("Sending authorization to backend...", { id: toastId });

      await postCommand({
        command: "follow",
        signature,
        address,
      });

      toast.success("Authorization Successful!", {
        id: toastId,
        description: "The relayer is now authorized to copy trades for you.",
      });
    } catch (err: unknown) {
      console.error("Follow action failed:", err);

      let description = "User rejected the signature request.";

      if (typeof err === "object" && err !== null && "message" in err) {
        const e = err as { message?: string };
        if (e.message) description = e.message;
      } else if (typeof err === "string") {
        description = err;
      }

      toast.error("Authorization Failed", {
        id: toastId,
        description,
      });
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-6">
      <h2 className="text-xl font-semibold">2. Authorize Copy-Trading</h2>
      <p className="text-muted-foreground text-sm">
        Click below to sign a free, gasless message that allows our relayer to
        execute trades for you.
      </p>
      <button
        onClick={handleFollow}
        disabled={!signer}
        className="w-full px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-semibold disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
      >
        Follow Trader
      </button>
    </div>
  );
}
