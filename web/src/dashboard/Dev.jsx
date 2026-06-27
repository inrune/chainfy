import React, { useMemo, useState } from 'react';
import { RefreshCw, Copy, Webhook } from 'lucide-react';
import { Button, Input, Label, CopyField, Badge } from '../components/ui.jsx';
import { cls, fmtSol, short, timeAgo } from '../lib/format.js';

export function DevelopersView({ state, onUpdateStore, onRollKeys, onShowToast }) {
  const { store } = state;
  const [revealLive, setRevealLive] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(store.webhookUrl || '');

  const quickstart = `// Create a product, then share its checkout link.
const res = await fetch("http://localhost:4000/api/products", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    name: "Cosmos Pro — Tailwind theme",
    price: 4.5,                 // SOL
    type: "download",
    delivery: "https://cdn.example.com/cosmos-pro.zip"
  })
});

const product = await res.json();
console.log("Checkout:", \`http://localhost:5173/c/\${product.id}\`);`;

  const verifySnippet = `import crypto from "crypto";

// Verify an incoming Chainfy webhook
app.post("/webhook", express.raw({ type: "*/*" }), (req, res) => {
  const sig = req.headers["x-chainfy-signature"];
  const expected = crypto
    .createHmac("sha256", "${store.webhookSecret}")
    .update(req.body)
    .digest("hex");

  if (sig !== expected) return res.status(400).end();

  const event = JSON.parse(req.body);
  if (event.type === "payment.succeeded") {
    // fulfil the order
  }
  res.json({ received: true });
});`;

  return (
    <div className="max-w-3xl space-y-7">
      <div>
        <h1 className="text-xl font-medium tracking-tight">API & webhooks</h1>
        <p className="text-sm text-slate-500 mt-0.5">Create products and listen for paid orders from your own code.</p>
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium">API keys</h2>
          <Button variant="outline" size="sm" onClick={onRollKeys}>
            <RefreshCw className="w-3 h-3" /> Roll keys
          </Button>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium">Test mode secret</span>
              <Badge tone="warning">Devnet only</Badge>
            </div>
            <CopyField value={store.apiKeyTest} />
            <p className="text-xs text-slate-500 mt-2">Use this for development. Moves only devnet SOL.</p>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium">Live mode secret</span>
              <Badge tone="danger">Treat as a password</Badge>
            </div>
            <div className="flex items-stretch h-9 border border-slate-200 rounded-md overflow-hidden bg-white">
              <div className="flex-1 px-3 text-sm flex items-center text-slate-700 truncate font-mono text-xs">
                {revealLive ? store.apiKeyLive : '•'.repeat(48)}
              </div>
              <button onClick={() => setRevealLive((v) => !v)} className="px-3 border-l border-slate-200 hover:bg-slate-50 text-slate-500 text-xs">
                {revealLive ? 'Hide' : 'Reveal'}
              </button>
              <button
                onClick={() => { navigator.clipboard?.writeText(store.apiKeyLive); onShowToast('Live key copied'); }}
                className="px-3 border-l border-slate-200 hover:bg-slate-50 text-slate-500"
                aria-label="Copy"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">Live keys aren't active until you complete mainnet onboarding.</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium mb-3">Quickstart</h2>
        <CodeBlock code={quickstart} onCopy={() => onShowToast('Snippet copied')} />
      </section>

      <section>
        <h2 className="text-sm font-medium mb-3">Webhook endpoint</h2>
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <div>
            <Label hint="HTTPS · receives event POSTs">URL</Label>
            <Input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://yourstore.com/api/chainfy/webhook" className="font-mono text-xs" />
          </div>
          <div>
            <Label hint="Used to verify event signatures (HMAC-SHA256)">Signing secret</Label>
            <CopyField value={store.webhookSecret} />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-700 mb-2">Events you'll receive</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {['payment.succeeded', 'product.created', 'product.updated'].map((evt) => (
                <label key={evt} className="flex items-center gap-2 text-xs">
                  <input type="checkbox" defaultChecked className="rounded border-slate-300 text-violet-600 focus:ring-violet-500" />
                  <code className="font-mono text-slate-700">{evt}</code>
                </label>
              ))}
            </div>
          </div>
          <div className="pt-2 flex justify-end">
            <Button variant="primary" onClick={() => { onUpdateStore({ webhookUrl }); onShowToast('Webhook saved'); }}>Save endpoint</Button>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium mb-3">Verify a webhook</h2>
        <CodeBlock code={verifySnippet} onCopy={() => onShowToast('Snippet copied')} />
      </section>
    </div>
  );
}

function CodeBlock({ code, onCopy }) {
  return (
    <div className="bg-slate-950 rounded-xl overflow-hidden">
      <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-800">
        <span className="text-xs px-2 py-0.5 rounded font-medium bg-slate-800 text-slate-100">Node</span>
        <button
          onClick={() => { navigator.clipboard?.writeText(code); onCopy && onCopy(); }}
          className="ml-auto text-xs text-slate-400 hover:text-slate-200 px-2 py-0.5 flex items-center gap-1"
        >
          <Copy className="w-3 h-3" /> Copy
        </button>
      </div>
      <pre className="px-4 py-3.5 text-xs font-mono leading-relaxed overflow-x-auto text-slate-300 whitespace-pre">{code}</pre>
    </div>
  );
}

export function LogsView({ state }) {
  const events = useMemo(() => {
    const evs = [];
    state.transactions.forEach((tx) => {
      evs.push({
        id: 'evt_' + tx.id,
        type: tx.status === 'succeeded' ? 'payment.succeeded' : tx.status === 'failed' ? 'payment.failed' : 'payment.pending',
        ts: tx.createdAt,
        meta: `${fmtSol(tx.amount)} SOL · ${tx.id}`,
      });
      if (tx.status === 'succeeded') {
        evs.push({ id: 'evt_d_' + tx.id, type: 'payment.delivered', ts: tx.createdAt + 300, meta: tx.productName });
      }
    });
    return evs.sort((a, b) => b.ts - a.ts).slice(0, 60);
  }, [state.transactions]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-medium tracking-tight">Event logs</h1>
        <p className="text-sm text-slate-500 mt-0.5">Every event Chainfy emitted — what your webhook would receive.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-200">
              <th className="text-left font-medium px-4 py-2.5 w-44">Event</th>
              <th className="text-left font-medium px-4 py-2.5">Event ID</th>
              <th className="text-left font-medium px-4 py-2.5">Details</th>
              <th className="text-right font-medium px-4 py-2.5 w-32">Time</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-xs text-slate-400">No events yet</td></tr>
            )}
            {events.map((e) => (
              <tr key={e.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                <td className="px-4 py-2.5">
                  <code className={cls('font-mono text-xs', e.type.includes('succeeded') || e.type.includes('delivered') ? 'text-emerald-700' : e.type.includes('failed') ? 'text-red-700' : 'text-slate-700')}>{e.type}</code>
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{short(e.id, 8, 6)}</td>
                <td className="px-4 py-2.5 text-xs text-slate-600 font-mono">{e.meta}</td>
                <td className="px-4 py-2.5 text-right text-xs text-slate-500">{timeAgo(e.ts)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
