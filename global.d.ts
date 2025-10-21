import type { Eip1193Provider } from "ethers";

interface MetaMaskProvider extends Eip1193Provider {
  on(event: "accountsChanged", handler: (accounts: string[]) => void): void;
  on(event: "chainChanged", handler: (chainId: string) => void): void;
  on(event: "connect", handler: (info: { chainId: string }) => void): void;
  on(
    event: "disconnect",
    handler: (error: { code: number; message: string }) => void,
  ): void;
  removeListener(
    event: "accountsChanged",
    handler: (accounts: string[]) => void,
  ): void;
  removeListener(
    event: "chainChanged",
    handler: (chainId: string) => void,
  ): void;
  removeListener(
    event: "connect",
    handler: (info: { chainId: string }) => void,
  ): void;
  removeListener(
    event: "disconnect",
    handler: (error: { code: number; message: string }) => void,
  ): void;
}

declare global {
  interface Window {
    ethereum?: MetaMaskProvider;
  }
}
