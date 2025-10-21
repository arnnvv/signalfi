import { ConnectWallet } from "@/components/ConnectWallet";
import { Deposit } from "@/components/Deposite";
import { Follow } from "@/components/Follow";

export default function DappPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <ConnectWallet />
      <main className="grow container mx-auto p-4 md:p-8">
        <div className="max-w-md mx-auto flex flex-col gap-8">
          <Deposit />
          <Follow />
        </div>
      </main>
      <footer className="text-center p-4 text-xs text-muted-foreground">
        <p>SignalFi</p>
      </footer>
    </div>
  );
}
