import React, { useState } from 'react';
import { Download, X, ExternalLink } from 'lucide-react';
import { Button, Modal, StatusBadge, Row } from '../components/ui.jsx';
import { cls, fmtSol, fmtUsd, short, formatDateTime } from '../lib/format.js';

function explorerUrl(signature) {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

export function TransactionsView({ state }) {
  const { transactions } = state;
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const filtered = filter === 'all' ? transactions : transactions.filter((t) => t.status === filter);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Sales</h1>
          <p className="text-sm text-slate-500 mt-0.5">{transactions.length} {transactions.length === 1 ? 'transaction' : 'transactions'} all-time</p>
        </div>
        <Button variant="outline"><Download className="w-3.5 h-3.5" /> Export CSV</Button>
      </div>

      <div className="flex items-center gap-1 border-b border-slate-200">
        {['all', 'succeeded', 'pending', 'failed'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cls(
              'px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors capitalize',
              filter === f ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-900'
            )}
          >
            {f === 'all' ? 'All' : f}
            <span className="ml-1.5 text-xs text-slate-400 font-mono">
              {f === 'all' ? transactions.length : transactions.filter((t) => t.status === f).length}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-200">
              <th className="text-left font-medium px-4 py-2.5">Amount</th>
              <th className="text-left font-medium px-4 py-2.5">Product</th>
              <th className="text-left font-medium px-4 py-2.5">Customer</th>
              <th className="text-left font-medium px-4 py-2.5">Transaction</th>
              <th className="text-left font-medium px-4 py-2.5">Status</th>
              <th className="text-right font-medium px-4 py-2.5">Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-xs text-slate-400">No transactions yet</td></tr>
            )}
            {filtered.map((tx) => (
              <tr key={tx.id} onClick={() => setSelected(tx)} className="border-t border-slate-100 hover:bg-slate-50/60 cursor-pointer">
                <td className="px-4 py-2.5 font-medium font-mono tabular-nums">{fmtSol(tx.amount)} SOL</td>
                <td className="px-4 py-2.5 text-slate-700 truncate max-w-[220px]">{tx.productName}</td>
                <td className="px-4 py-2.5 text-slate-500 text-xs">
                  <div className="font-mono">{short(tx.customer)}</div>
                  <div className="text-[10px] text-slate-400 truncate">{tx.customerEmail}</div>
                </td>
                <td className="px-4 py-2.5 text-slate-500 font-mono text-xs">{short(tx.signature, 6, 6)}</td>
                <td className="px-4 py-2.5"><StatusBadge status={tx.status} /></td>
                <td className="px-4 py-2.5 text-right text-slate-500 text-xs">{formatDateTime(tx.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} size="lg">
        {selected && <TransactionDetail tx={selected} onClose={() => setSelected(null)} />}
      </Modal>
    </div>
  );
}

function TransactionDetail({ tx, onClose }) {
  const isReal = tx.signature && tx.signature.length >= 80 && tx.slot; // seeded data has no slot
  return (
    <>
      <div className="px-6 py-5 border-b border-slate-200">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs text-slate-500 mb-0.5">Payment</div>
            <div className="text-2xl font-medium tracking-tight font-mono tabular-nums">{fmtSol(tx.amount)} SOL</div>
            <div className="text-sm text-slate-500 mt-0.5 font-mono tabular-nums">≈ ${fmtUsd(tx.amount)}</div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <StatusBadge status={tx.status} />
          <span className="text-xs text-slate-400">·</span>
          <span className="text-xs text-slate-500 font-mono">{formatDateTime(tx.createdAt)}</span>
        </div>
      </div>

      <div className="px-6 py-5 space-y-4 text-sm">
        <Row label="Product" value={tx.productName} />
        <Row label="Customer email" value={tx.customerEmail} />
        <Row label="Customer wallet" value={tx.customer} mono />
        <Row label="Transaction ID" value={tx.id} mono />
        <Row label="Network" value="solana-devnet" mono />
        <Row label="Signature" value={short(tx.signature, 14, 14)} mono />
        <hr className="border-slate-100" />
        <Row label="Gross" value={`${fmtSol(tx.amount)} SOL`} mono />
        <Row label="Chainfy fee (1%)" value={`−${fmtSol(tx.fee)} SOL`} mono />
        <Row label="Net to wallet" value={`${fmtSol(tx.net)} SOL`} mono bold />
        {isReal && (
          <a href={explorerUrl(tx.signature)} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-700 font-medium pt-1">
            View on Solana Explorer <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {tx.delivery && tx.status === 'succeeded' && (
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 rounded-b-xl">
          <div className="text-xs text-slate-500 mb-1.5 font-medium">Delivered to customer</div>
          {tx.deliveryType === 'license' && (
            <div className="font-mono text-sm bg-white px-3 py-2 rounded-md border border-slate-200">{tx.delivery}</div>
          )}
          {tx.deliveryType !== 'license' && (
            <div className="flex items-center gap-2 font-mono text-xs bg-white px-3 py-2 rounded-md border border-slate-200">
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span className="truncate">{tx.delivery}</span>
            </div>
          )}
        </div>
      )}
    </>
  );
}
