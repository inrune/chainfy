import React, { useEffect, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
  ShieldCheck, ArrowRight, ArrowLeft, Loader2, Check, AlertCircle,
  Download, ExternalLink, Copy, Wallet, ChevronRight,
} from 'lucide-react';
import {
  Button, Input, Label, Badge, Row, ProductThumb, ProductTypeBadge,
} from '../components/ui.jsx';
import { fmtSol, fmtUsd, short } from '../lib/format.js';
import { payForProduct } from '../lib/solana.js';
import { api } from '../api.js';

export default function Checkout({ productId }) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected, connecting, disconnect, wallet } = useWallet();
  const { setVisible } = useWalletModal();

  const [product, setProduct] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [email, setEmail] = useState('');
  const [stage, setStage] = useState('details'); // details | paying | success | failed
  const [tx, setTx] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [balance, setBalance] = useState(null);

  // Load the product
  useEffect(() => {
    let alive = true;
    api
      .getCheckout(productId)
      .then((p) => { if (alive) setProduct(p); })
      .catch((e) => { if (alive) setLoadError(e.detail?.error || 'could_not_load_product'); });
    return () => { alive = false; };
  }, [productId]);

  // Check balance once connected
  useEffect(() => {
    if (!connected || !publicKey) { setBalance(null); return; }
    let alive = true;
    connection.getBalance(publicKey).then((lamports) => {
      if (alive) setBalance(lamports / LAMPORTS_PER_SOL);
    }).catch(() => {});
    return () => { alive = false; };
  }, [connected, publicKey, connection, stage]);

  async function handlePay() {
    if (!connected || !publicKey) { setVisible(true); return; }
    setErrorMsg('');
    setStage('paying');
    try {
      const signature = await payForProduct({
        connection,
        payer: publicKey,
        sendTransaction,
        merchantWallet: product.merchantWallet,
        priceSol: product.price,
      });

      const result = await api.confirmCheckout({
        productId: product.id,
        signature,
        email: email || 'guest@example.com',
        customerWallet: publicKey.toBase58(),
      });

      setTx(result.transaction);
      setStage('success');
    } catch (e) {
      const msg = e?.message || String(e);
      if (/insufficient|0x1\b|debit an account/i.test(msg)) {
        setErrorMsg('Your wallet doesn\u2019t have enough devnet SOL. Fund it from the faucet and try again.');
      } else if (/User rejected|reject/i.test(msg)) {
        setErrorMsg('You declined the transaction in your wallet.');
      } else if (e?.detail?.error === 'payment_verification_failed') {
        setErrorMsg('We couldn\u2019t verify the payment on-chain. If SOL left your wallet, contact the seller.');
      } else {
        setErrorMsg(msg.slice(0, 160));
      }
      setStage('failed');
    }
  }

  const insufficient = balance != null && product && balance < product.price;

  // ---- render -------------------------------------------------------------

  if (loadError) {
    return (
      <Shell>
        <div className="p-10 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-base font-medium mb-1">This checkout isn't available</div>
          <p className="text-xs text-slate-500 max-w-[280px] mx-auto">
            {loadError === 'store_wallet_not_set'
              ? 'The seller hasn\u2019t set a payout wallet yet.'
              : 'We couldn\u2019t find this product. The link may be wrong or the product was removed.'}
          </p>
        </div>
      </Shell>
    );
  }

  if (!product) {
    return (
      <Shell>
        <div className="p-16 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </div>
      </Shell>
    );
  }

  return (
    <Shell store={{ name: product.storeName }}>
      {stage === 'success' && tx ? (
        <PaymentSuccess tx={tx} email={email} />
      ) : stage === 'failed' ? (
        <PaymentFailed message={errorMsg} onRetry={() => setStage('details')} />
      ) : stage === 'paying' ? (
        <Paying wallet={wallet?.adapter?.name} product={product} />
      ) : (
        <>
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-start gap-4">
              <ProductThumb product={product} size={56} />
              <div className="flex-1 min-w-0">
                <div className="text-base font-medium tracking-tight leading-snug">{product.name}</div>
                <div className="text-xs text-slate-500 mt-1 leading-relaxed">{product.description}</div>
                <div className="mt-2"><ProductTypeBadge type={product.type} /></div>
              </div>
            </div>
          </div>

          <div className="p-6 border-b border-slate-100">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-slate-500 uppercase tracking-wide font-medium">Total due</span>
              <div className="text-right">
                <div className="text-2xl font-medium tracking-tight font-mono tabular-nums">{fmtSol(product.price)} SOL</div>
                <div className="text-xs text-slate-500 font-mono tabular-nums">≈ ${fmtUsd(product.price)}</div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <Label hint="We'll send your delivery here">Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>

            {/* Wallet status */}
            {connected && publicKey ? (
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/60">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-violet-100 flex items-center justify-center text-violet-700">
                    <Wallet className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium">{wallet?.adapter?.name || 'Wallet'} connected</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {short(publicKey.toBase58(), 4, 4)}
                      {balance != null && <> · {fmtSol(balance)} SOL</>}
                    </div>
                  </div>
                </div>
                <button onClick={() => disconnect()} className="text-[11px] text-slate-500 hover:text-slate-900">Change</button>
              </div>
            ) : (
              <button
                onClick={() => setVisible(true)}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center text-slate-600">
                    <Wallet className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm font-medium">{connecting ? 'Connecting…' : 'Connect a wallet'}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            )}

            {insufficient && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-100 text-xs text-amber-800">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>Not enough devnet SOL. <a href="https://faucet.solana.com" target="_blank" rel="noopener" className="underline">Get some free</a>, then refresh.</span>
              </div>
            )}

            <Button
              variant="primary"
              size="lg"
              onClick={handlePay}
              className="w-full bg-violet-600 hover:bg-violet-700"
              disabled={!email.includes('@') || (connected && insufficient)}
            >
              {connected ? `Pay ${fmtSol(product.price)} SOL` : 'Connect wallet to pay'}
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
            <div className="text-[11px] text-slate-500 text-center">
              Real on-chain payment on Solana devnet. No real money moves.
            </div>
          </div>
        </>
      )}
    </Shell>
  );
}

function Shell({ children, store }) {
  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: 'ui-sans-serif, system-ui' }}>
      <div className="max-w-md mx-auto px-5 py-10">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-violet-700 text-sm font-medium">
            {(store?.name || 'C')[0].toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-medium">{store?.name || 'Chainfy'}</div>
            <div className="text-[11px] text-slate-500">Secure checkout</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {children}
        </div>

        <div className="mt-5 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3" /> Secured by Chainfy · 1% flat fee
          </div>
          <code className="font-mono">solana-devnet</code>
        </div>
      </div>
    </div>
  );
}

function Paying({ wallet, product }) {
  return (
    <div className="p-10 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-violet-50 mb-4">
        <Loader2 className="w-6 h-6 text-violet-600 animate-spin" />
      </div>
      <div className="text-base font-medium mb-1.5">Confirm in {wallet || 'your wallet'}</div>
      <p className="text-xs text-slate-500 leading-relaxed max-w-[280px] mx-auto">
        Approve the transfer of <span className="font-mono tabular-nums">{fmtSol(product.price)} SOL</span>. We’ll verify it on-chain and unlock your purchase automatically.
      </p>
      <div className="mt-6 flex items-center justify-center gap-3 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Connected</div>
        <span>·</span>
        <div className="flex items-center gap-1.5"><Loader2 className="w-2.5 h-2.5 animate-spin" /> Waiting for confirmation</div>
      </div>
    </div>
  );
}

function PaymentSuccess({ tx, email }) {
  const [copied, setCopied] = useState(false);
  const copy = (val) => {
    navigator.clipboard?.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <>
      <div className="p-6 border-b border-slate-100 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 mb-3">
          <Check className="w-5 h-5 text-emerald-600" strokeWidth={3} />
        </div>
        <div className="text-base font-medium mb-0.5">Payment confirmed</div>
        <p className="text-xs text-slate-500">Verified on Solana devnet · receipt sent to <span className="font-mono">{email}</span></p>
      </div>

      <div className="p-6 border-b border-slate-100 space-y-2">
        <div className="text-xs uppercase tracking-wider text-slate-500 font-medium">
          {tx.deliveryType === 'license' ? 'Your license key' : tx.deliveryType === 'download' ? 'Your download' : 'Your access link'}
        </div>
        {tx.deliveryType === 'license' && (
          <div className="bg-slate-900 text-white rounded-lg p-4 flex items-center justify-between gap-3">
            <code className="font-mono text-sm tracking-wider">{tx.delivery}</code>
            <button onClick={() => copy(tx.delivery)} className="text-slate-400 hover:text-white p-1 rounded">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
        {tx.deliveryType === 'download' && (
          <a href={tx.delivery} target="_blank" rel="noopener" className="flex items-center justify-between gap-3 p-3.5 bg-violet-50 border border-violet-100 rounded-lg hover:bg-violet-100/60">
            <div className="flex items-center gap-3 min-w-0">
              <Download className="w-4 h-4 text-violet-700 shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-medium text-violet-900">Download file</div>
                <div className="text-[11px] font-mono text-violet-700 truncate">{tx.delivery}</div>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-violet-700 shrink-0" />
          </a>
        )}
        {tx.deliveryType === 'redirect' && (
          <a href={tx.delivery} target="_blank" rel="noopener" className="flex items-center justify-between gap-3 p-3.5 bg-emerald-50 border border-emerald-100 rounded-lg hover:bg-emerald-100/60">
            <div className="flex items-center gap-3 min-w-0">
              <ExternalLink className="w-4 h-4 text-emerald-700 shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-medium text-emerald-900">Open access link</div>
                <div className="text-[11px] font-mono text-emerald-700 truncate">{tx.delivery}</div>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          </a>
        )}
      </div>

      <div className="p-6 space-y-2 text-xs">
        <Row label="Amount" value={`${fmtSol(tx.amount)} SOL`} mono />
        <Row label="Signature" value={short(tx.signature, 10, 10)} mono />
        <Row label="Network" value="solana-devnet" mono />
        <a href={`https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-700 font-medium pt-1">
          View on Solana Explorer <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </>
  );
}

function PaymentFailed({ message, onRetry }) {
  return (
    <div className="p-8 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-3">
        <AlertCircle className="w-5 h-5 text-red-600" />
      </div>
      <div className="text-base font-medium mb-1">Payment didn't go through</div>
      <p className="text-xs text-slate-500 mb-5 max-w-[300px] mx-auto">{message || 'Something went wrong before the transaction confirmed. You haven\u2019t been charged.'}</p>
      <div className="flex items-center justify-center gap-2">
        <Button variant="primary" onClick={onRetry}>Try again</Button>
      </div>
    </div>
  );
}
