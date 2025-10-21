import { Inter } from "next/font/google";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { JSX, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { WalletProvider } from "@/components/WalletProvider";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
};

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Arc-Yellow Trader dApp",
  description: "Deposit and Follow Trades",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>): JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable,
        )}
      >
        <WalletProvider>
          {children}
          <Toaster />
        </WalletProvider>
      </body>
    </html>
  );
}
