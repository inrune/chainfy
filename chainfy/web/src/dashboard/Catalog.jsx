import React, { useState } from 'react';
import {
  Package, Plus, Search, Eye, Edit, Trash2, Link as LinkIcon,
  Download, Key, X,
} from 'lucide-react';
import {
  Button, Input, Textarea, Label, Modal, ProductThumb, ProductTypeBadge,
} from '../components/ui.jsx';
import { cls, fmtSol, fmtUsd, timeAgo } from '../lib/format.js';

export function ProductsView({ state, onPreview, onEdit, onNew, onDelete, onCopyLink }) {
  const { products, transactions } = state;
  const [query, setQuery] = useState('');

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(query.toLowerCase())
  );

  if (products.length === 0) {
    return (
      <div className="max-w-md mx-auto pt-12 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-100 text-slate-700 mb-4">
          <Package className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-medium tracking-tight mb-1.5">No products yet</h2>
        <p className="text-sm text-slate-600 mb-5">Add a digital download, license, or gated link to get a checkout URL you can share.</p>
        <Button variant="accent" size="lg" onClick={onNew}>
          <Plus className="w-3.5 h-3.5" /> Create a product
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Products</h1>
          <p className="text-sm text-slate-500 mt-0.5">{products.length} {products.length === 1 ? 'product' : 'products'} · digital delivery only</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 w-56 h-8 px-3 bg-white border border-slate-200 rounded-md">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter products" className="flex-1 bg-transparent outline-none text-sm placeholder:text-slate-400" />
          </div>
          <Button variant="accent" onClick={onNew}><Plus className="w-3.5 h-3.5" /> New product</Button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-200">
              <th className="text-left font-medium px-4 py-2.5">Product</th>
              <th className="text-left font-medium px-4 py-2.5 w-24">Type</th>
              <th className="text-right font-medium px-4 py-2.5 w-28">Price</th>
              <th className="text-right font-medium px-4 py-2.5 w-24">Sales</th>
              <th className="text-right font-medium px-4 py-2.5 w-32">Volume</th>
              <th className="text-right font-medium px-4 py-2.5 w-28">Created</th>
              <th className="px-4 py-2.5 w-32"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const pt = transactions.filter((t) => t.productId === p.id && t.status === 'succeeded');
              const vol = pt.reduce((a, t) => a + t.amount, 0);
              return (
                <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <ProductThumb product={p} size={36} />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{p.name}</div>
                        <div className="text-xs text-slate-500 truncate max-w-[280px]">{p.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><ProductTypeBadge type={p.type} /></td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums font-medium">{fmtSol(p.price)} SOL</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600">{pt.length}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600">{fmtSol(vol)} SOL</td>
                  <td className="px-4 py-3 text-right text-xs text-slate-500">{timeAgo(p.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => onCopyLink(p)} className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700" title="Copy checkout link">
                        <LinkIcon className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => onPreview(p)} className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700" title="Open checkout">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => onEdit(p)} className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700" title="Edit">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { if (window.confirm(`Delete "${p.name}"? This won't refund any sales.`)) onDelete(p.id); }}
                        className="p-1.5 rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-xs text-slate-400">No products match "{query}"</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ProductFormModal({ mode, product, onClose, onSave }) {
  const [form, setForm] = useState(
    product || { id: '', name: '', description: '', price: 1, type: 'download', delivery: '', color: 'violet' }
  );
  const [saving, setSaving] = useState(false);
  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onSave({ ...form, price: Number(form.price) || 0 });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={true} onClose={onClose} size="lg">
      <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
        <h2 className="text-lg font-medium tracking-tight">{mode === 'edit' ? 'Edit product' : 'New product'}</h2>
        <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
        <div>
          <Label>Product name</Label>
          <Input autoFocus value={form.name} onChange={(e) => update({ name: e.target.value })} placeholder="Cosmos Pro — Tailwind theme" />
        </div>

        <div>
          <Label hint="Shown at checkout">Description</Label>
          <Textarea rows={3} value={form.description} onChange={(e) => update({ description: e.target.value })} placeholder="A premium Tailwind theme for SaaS landing pages…" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label hint="SOL">Price</Label>
            <div className="relative">
              <Input type="number" step="0.001" min="0" value={form.price} onChange={(e) => update({ price: e.target.value })} className="font-mono tabular-nums" />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono pointer-events-none">SOL</div>
            </div>
            <div className="mt-1.5 text-xs text-slate-500 font-mono tabular-nums">
              ≈ ${fmtUsd(Number(form.price) || 0)} · 1% fee = {fmtSol((Number(form.price) || 0) * 0.01)} SOL
            </div>
          </div>
          <div>
            <Label>Thumbnail color</Label>
            <div className="flex items-center gap-1.5">
              {['violet', 'slate', 'amber', 'emerald', 'rose', 'sky'].map((c) => (
                <button
                  key={c}
                  onClick={() => update({ color: c })}
                  className={cls(
                    'w-9 h-9 rounded-md transition-all',
                    { violet: 'bg-violet-100', slate: 'bg-slate-200', amber: 'bg-amber-100', emerald: 'bg-emerald-100', rose: 'bg-rose-100', sky: 'bg-sky-100' }[c],
                    form.color === c ? 'ring-2 ring-slate-900 ring-offset-1' : 'hover:scale-105'
                  )}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
        </div>

        <div>
          <Label hint="How buyers receive what they paid for">Delivery method</Label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'download', label: 'File download', desc: 'Direct URL', icon: Download },
              { id: 'license', label: 'License key', desc: 'Auto-generated', icon: Key },
              { id: 'redirect', label: 'Access link', desc: 'Discord, Notion…', icon: LinkIcon },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => update({ type: opt.id })}
                className={cls(
                  'p-3 rounded-lg border text-left transition-colors',
                  form.type === opt.id ? 'border-violet-500 bg-violet-50/40 ring-2 ring-violet-500/20' : 'border-slate-200 hover:border-slate-300'
                )}
              >
                <opt.icon className={cls('w-4 h-4 mb-1.5', form.type === opt.id ? 'text-violet-600' : 'text-slate-500')} />
                <div className="text-xs font-medium">{opt.label}</div>
                <div className="text-[10px] text-slate-500">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          {form.type === 'download' && (
            <>
              <Label hint="HTTPS link to the file">Download URL</Label>
              <Input value={form.delivery} onChange={(e) => update({ delivery: e.target.value })} placeholder="https://cdn.example.com/cosmos-pro-v1.2.zip" className="font-mono text-xs" />
            </>
          )}
          {form.type === 'license' && (
            <>
              <Label hint="Keys are generated per purchase">License prefix</Label>
              <Input value={form.delivery} onChange={(e) => update({ delivery: e.target.value.toUpperCase().slice(0, 8) })} placeholder="COSMOS" className="font-mono uppercase" />
              <div className="mt-1.5 text-xs text-slate-500 font-mono">Example: {form.delivery || 'KEY'}-A8K2-7HM3-X9P1-RDGL</div>
            </>
          )}
          {form.type === 'redirect' && (
            <>
              <Label hint="Where buyers are sent after payment">Access URL</Label>
              <Input value={form.delivery} onChange={(e) => update({ delivery: e.target.value })} placeholder="https://discord.gg/your-invite" className="font-mono text-xs" />
            </>
          )}
        </div>
      </div>

      <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-end gap-2 rounded-b-xl">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={submit} disabled={!form.name.trim() || saving}>
          {saving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create product'}
        </Button>
      </div>
    </Modal>
  );
}
