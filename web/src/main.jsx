// Polyfill must run before anything imports @solana/web3.js.
import { Buffer } from 'buffer';
if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = Buffer;
}

import React, { useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { clusterApiUrl } from '@solana/web3.js';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';

import App from './App.jsx';
import './index.css';
import '@solana/wallet-adapter-react-ui/styles.css';

function Root() {
  // Modern wallets (Phantom, Solflare, Backpack) register themselves through
  // the Wallet Standard, so we can pass an empty adapter array and they still
  // appear in the connect modal.
  const endpoint = useMemo(
    () => import.meta.env.VITE_SOLANA_RPC || clusterApiUrl('devnet'),
    []
  );
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <App />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
