import React, { useEffect, useState } from 'react';
import {
  Home, Package, Receipt, Users, Webhook, ScrollText, Settings as SettingsIcon,
  BookOpen, Search, Plus, Code, Loader2, AlertCircle, Wallet, ArrowRight,
  ShieldCheck, Zap,
} from 'lucide-react';

import { api } from './api.js';
import { NavItem, Button, Badge, ChainfyMark } from './components/ui.jsx';
import { short } from './lib/format.js';

import Dashboard from './dashboard/Dashboard.jsx';
import { ProductsView, ProductFormModal } from './dashboard/Catalog.jsx';
import { TransactionsView } from './dashboard/Sales.jsx';
import { CustomersView } from './dashboard/People.jsx';
import { DevelopersView, LogsView } from './dashboard/Dev.jsx';
import { SettingsView } from './dashboard/Settings.jsx';
import Checkout from './checkout/Checkout.jsx';

// Tiny path-based router: /c/<id> is the customer checkout, everything else
// is the merchant dashboard.
function getCheckoutId() {
  const m = window.location.pathname.match(/^\/c\/([^/]+)\/?$/);
  return m ? m[1] : null;
}

export default function App() {
  const checkoutId = getCheckoutId();
  if (checkoutId) return <Checkout productId={checkoutId} />;
  return <Dashboard_App />;
}

function Dashboard_App() {
  const [state, setState] = useState({ store: null, products: [], transactions: [] });
  const [view, setView] = useState('home');
  const [loading, setLoading] = useState(true);
  const [connError, setConnError] = useState(false);
  const [modal, setModal] = useState(null); // { mode, product }
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  async function loadAll() {
    setConnError(false);
    try {
      const [store, products, transactions] = await Promise.all([
        api.getStore(),
        api.getProducts(),
        api.getTransactions(),
      ]);
      setState({ store, products, transactions });
    } catch (e) {
      setConnError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  async function refresh() {
    const [products, transactions] = await Promise.all([api.getProducts(), api.getTransactions()]);
    setState((s) => ({ ...s, products, transactions }));
  }

  // ---- handlers ----------------------------------------------------------
  const saveProduct = async (form) => {
    if (form.id) await api.updateProduct(form.id, form);
    else await api.createProduct(form);
    await refresh();
    setModal(null);
    showToast(form.id ? 'Product updated' : 'Product created');
  };
  const deleteProduct = async (id) => { await api.deleteProduct(id); await refresh(); showToast('Product deleted'); };
  const updateStore = async (patch) => { const store = await api.updateStore(patch); setState((s) => ({ ...s, store })); };
  const rollKeys = async () => { const store = await api.rollKeys(); setState((s) => ({ ...s, store })); showToast('API keys rolled'); };
  const loadSample = async () => { await api.seed(); await loadAll(); showToast('Sample data loaded'); };
  const resetAll = async () => { await api.reset(true); await loadAll(); setView('home'); showToast('Workspace reset'); };
  const previewProduct = (p) => window.open(`/c/${p.id}`, '_blank');
  const copyLink = (p) => { navigator.clipboard?.writeText(`${window.location.origin}/c/${p.id}`); showToast('Checkout link copied'); };

  // ---- gate screens ------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  if (connError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
        <div className="max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-100 text-red-600 mb-4">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-medium tracking-tight mb-1.5">Can't reach the Chainfy API</h1>
          <p className="text-sm text-slate-600 mb-4">
            The backend isn't responding on <code className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">localhost:4000</code>.
            Start it in a terminal:
          </p>
          <pre className="text-left text-xs font-mono bg-slate-950 text-slate-200 rounded-lg p-3 mb-4">cd server
npm install
npm start</pre>
          <Button variant="primary" onClick={loadAll}>Retry</Button>
        </div>
      </div>
    );
  }

  const nav = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'transactions', label: 'Sales', icon: Receipt },
    { id: 'customers', label: 'Customers', icon: Users },
  ];
  const devNav = [
    { id: 'developers', label: 'API & webhooks', icon: Code },
    { id: 'logs', label: 'Event logs', icon: ScrollText },
  ];
  const wsNav = [
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
    { id: 'docs', label: 'Docs', icon: BookOpen },
  ];

  const walletSet = !!(state.store && state.store.wallet);

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900">
      {/* Sidebar */}
      <aside className="w-60 border-r border-slate-200 bg-white flex flex-col fixed inset-y-0 left-0">
        <div className="px-4 h-14 flex items-center gap-2 border-b border-slate-100">
          <div className="text-violet-600"><ChainfyMark size={20} /></div>
          <span className="font-medium tracking-tight">Chainfy</span>
          <Badge tone="warning">devnet</Badge>
        </div>

        <div className="px-3 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md">
            <div className="w-7 h-7 rounded-md bg-violet-100 flex items-center justify-center text-violet-700 text-xs font-medium">
              {(state.store?.name || 'M')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{state.store?.name || 'My store'}</div>
              <div className="text-[11px] text-slate-500">Test mode</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          <div className="space-y-0.5">
            {nav.map((n) => (
              <NavItem key={n.id} icon={n.icon} active={view === n.id} onClick={() => setView(n.id)}>{n.label}</NavItem>
            ))}
          </div>
          <div>
            <div className="px-2 mb-1 text-[10px] uppercase tracking-wider text-slate-400 font-medium">Developer</div>
            <div className="space-y-0.5">
              {devNav.map((n) => (
                <NavItem key={n.id} icon={n.icon} active={view === n.id} onClick={() => setView(n.id)}>{n.label}</NavItem>
              ))}
            </div>
          </div>
          <div>
            <div className="px-2 mb-1 text-[10px] uppercase tracking-wider text-slate-400 font-medium">Workspace</div>
            <div className="space-y-0.5">
              {wsNav.map((n) => (
                <NavItem key={n.id} icon={n.icon} active={view === n.id} onClick={() => setView(n.id)}>{n.label}</NavItem>
              ))}
            </div>
          </div>
        </nav>

        <div className="px-3 py-3 border-t border-slate-100">
          <div className="flex items-center gap-2 px-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-3 h-3" /> 1% flat · no monthly fee
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 ml-60 flex flex-col min-h-screen">
        <header className="h-14 border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-10 flex items-center justify-between px-6">
          <div className="flex items-center gap-2 w-80 h-8 px-3 bg-slate-50 border border-slate-200 rounded-md">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input placeholder="Search products, sales, customers…" className="flex-1 bg-transparent outline-none text-sm placeholder:text-slate-400" />
          </div>
          <div className="flex items-center gap-3">
            <Badge tone="warning"><Zap className="w-2.5 h-2.5" /> Test mode</Badge>
            <Button variant="accent" onClick={() => setModal({ mode: 'create' })}>
              <Plus className="w-3.5 h-3.5" /> New product
            </Button>
          </div>
        </header>

        {!walletSet && (
          <div className="bg-violet-50 border-b border-violet-100 px-6 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-violet-900">
              <Wallet className="w-4 h-4" />
              Set your payout wallet so sales can settle on devnet.
            </div>
            <button onClick={() => setView('settings')} className="text-sm font-medium text-violet-700 hover:text-violet-800 flex items-center gap-1">
              Add wallet <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <main className="flex-1 px-6 py-6">
          {view === 'home' && (
            <Dashboard
              state={state}
              onPreviewProduct={previewProduct}
              onLoadSample={loadSample}
              onNewProduct={() => setModal({ mode: 'create' })}
              onGoto={setView}
            />
          )}
          {view === 'products' && (
            <ProductsView
              state={state}
              onPreview={previewProduct}
              onEdit={(p) => setModal({ mode: 'edit', product: p })}
              onNew={() => setModal({ mode: 'create' })}
              onDelete={deleteProduct}
              onCopyLink={copyLink}
            />
          )}
          {view === 'transactions' && <TransactionsView state={state} />}
          {view === 'customers' && <CustomersView state={state} />}
          {view === 'developers' && (
            <DevelopersView state={state} onUpdateStore={updateStore} onRollKeys={rollKeys} onShowToast={showToast} />
          )}
          {view === 'logs' && <LogsView state={state} />}
          {view === 'settings' && (
            <SettingsView state={state} onUpdateStore={updateStore} onLoadSample={loadSample} onReset={resetAll} onShowToast={showToast} />
          )}
          {view === 'docs' && <DocsView />}
        </main>
      </div>

      {modal && (
        <ProductFormModal
          mode={modal.mode}
          product={modal.product}
          onClose={() => setModal(null)}
          onSave={saveProduct}
        />
      )}

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          {toast}
        </div>
      )}
    </div>
  );
}

function DocsView() {
  const steps = [
    { n: 1, t: 'Set your payout wallet', d: 'In Settings, paste a Solana devnet address. Every sale settles there, minus the 1% fee.' },
    { n: 2, t: 'Create a product', d: 'Pick a delivery method — file download, auto-generated license key, or a gated access link — and set a price in SOL.' },
    { n: 3, t: 'Share the checkout link', d: 'Each product gets a /c/<id> URL. Send it anywhere; buyers connect a wallet and pay on devnet.' },
    { n: 4, t: 'We verify on-chain', d: 'When a buyer pays, the backend looks up the transaction signature on devnet and confirms the funds landed before delivering the product.' },
    { n: 5, t: 'Listen for webhooks', d: 'Point a URL at Chainfy and verify the HMAC signature to fulfil orders from your own systems.' },
  ];
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-medium tracking-tight">How Chainfy works</h1>
        <p className="text-sm text-slate-500 mt-0.5">Accept Solana payments for digital products in five steps.</p>
      </div>
      <div className="space-y-3">
        {steps.map((s) => (
          <div key={s.n} className="flex gap-4 bg-white border border-slate-200 rounded-xl p-4">
            <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-sm font-medium shrink-0">{s.n}</div>
            <div>
              <div className="text-sm font-medium">{s.t}</div>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{s.d}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600">
        <div className="font-medium text-slate-900 mb-1">Devnet only</div>
        This build runs entirely on Solana devnet — the SOL has no real value. To go live you'd switch the cluster to mainnet-beta, fund a real wallet, and move storage to a real database. See the README for the full guide.
      </div>
    </div>
  );
}
