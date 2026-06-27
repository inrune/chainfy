import React, { useEffect, useState } from 'react';
import { Sparkles, ExternalLink } from 'lucide-react';
import { Button, Input, Label } from '../components/ui.jsx';

export function SettingsView({ state, onUpdateStore, onLoadSample, onReset, onShowToast }) {
  const { store } = state;
  const [form, setForm] = useState(store);

  useEffect(() => { setForm(store); }, [store]);

  const dirty = JSON.stringify(form) !== JSON.stringify(store);

  return (
    <div className="max-w-2xl space-y-7">
      <div>
        <h1 className="text-xl font-medium tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Workspace configuration and danger zone.</p>
      </div>

      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-medium border-b border-slate-100 pb-3">Store details</h2>
        <div>
          <Label>Store name</Label>
          <Input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <Label>Contact email</Label>
          <Input value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <Label hint="Sales settle here — Solana devnet address">Payout wallet</Label>
          <Input value={form.wallet || ''} onChange={(e) => setForm({ ...form, wallet: e.target.value })} placeholder="Paste your devnet wallet address" className="font-mono text-xs" />
          <a href="https://faucet.solana.com" target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 mt-2">
            Get devnet SOL from the faucet <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <div className="pt-2 flex items-center justify-end gap-2">
          <Button variant="outline" disabled={!dirty} onClick={() => setForm(store)}>Cancel</Button>
          <Button variant="primary" disabled={!dirty} onClick={() => { onUpdateStore(form); onShowToast('Store updated'); }}>Save changes</Button>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
        <h2 className="text-sm font-medium border-b border-slate-100 pb-3">Demo data</h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Replace with fresh sample data</div>
            <p className="text-xs text-slate-500 mt-0.5">Generates 4 example products and 34 simulated sales. Your wallet setting is kept.</p>
          </div>
          <Button variant="outline" onClick={onLoadSample}>
            <Sparkles className="w-3.5 h-3.5" /> Load sample
          </Button>
        </div>
      </section>

      <section className="bg-white border border-red-100 rounded-xl p-5 space-y-3">
        <h2 className="text-sm font-medium text-red-900 border-b border-red-50 pb-3">Danger zone</h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-slate-900">Reset workspace</div>
            <p className="text-xs text-slate-500 mt-0.5">Deletes all products and transactions. Cannot be undone.</p>
          </div>
          <Button variant="danger" onClick={() => { if (window.confirm('This wipes all products and transactions. Are you sure?')) onReset(); }}>
            Reset everything
          </Button>
        </div>
      </section>
    </div>
  );
}
