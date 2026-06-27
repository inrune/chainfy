import React, { useMemo } from 'react';
import { Users } from 'lucide-react';
import { fmtSol, short, timeAgo, formatDate } from '../lib/format.js';

export function CustomersView({ state }) {
  const { transactions } = state;

  const customers = useMemo(() => {
    const map = new Map();
    transactions.forEach((tx) => {
      const key = tx.customer || tx.customerEmail;
      if (!map.has(key)) {
        map.set(key, {
          wallet: tx.customer,
          email: tx.customerEmail,
          totalSpent: 0,
          purchases: 0,
          lastPurchase: 0,
          firstPurchase: Infinity,
        });
      }
      const c = map.get(key);
      if (tx.status === 'succeeded') {
        c.totalSpent += tx.amount;
        c.purchases += 1;
      }
      c.lastPurchase = Math.max(c.lastPurchase, tx.createdAt);
      c.firstPurchase = Math.min(c.firstPurchase, tx.createdAt);
    });
    return Array.from(map.values()).sort((a, b) => b.lastPurchase - a.lastPurchase);
  }, [transactions]);

  if (customers.length === 0) {
    return (
      <div className="max-w-md mx-auto pt-12 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-100 text-slate-700 mb-4">
          <Users className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-medium tracking-tight mb-1.5">No customers yet</h2>
        <p className="text-sm text-slate-600">Customer records are created automatically when someone buys.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-medium tracking-tight">Customers</h1>
        <p className="text-sm text-slate-500 mt-0.5">{customers.length} unique {customers.length === 1 ? 'wallet' : 'wallets'} have paid you</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-200">
              <th className="text-left font-medium px-4 py-2.5">Customer</th>
              <th className="text-left font-medium px-4 py-2.5">Wallet</th>
              <th className="text-right font-medium px-4 py-2.5">Purchases</th>
              <th className="text-right font-medium px-4 py-2.5">Total spent</th>
              <th className="text-right font-medium px-4 py-2.5">First seen</th>
              <th className="text-right font-medium px-4 py-2.5">Last seen</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c, i) => (
              <tr key={i} className="border-t border-slate-100 hover:bg-slate-50/60">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-700">
                      {(c.email || '?')[0].toUpperCase()}
                    </div>
                    <div className="text-sm truncate max-w-[200px]">{c.email}</div>
                  </div>
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{short(c.wallet, 6, 6)}</td>
                <td className="px-4 py-2.5 text-right font-mono tabular-nums">{c.purchases}</td>
                <td className="px-4 py-2.5 text-right font-mono tabular-nums font-medium">{fmtSol(c.totalSpent)} SOL</td>
                <td className="px-4 py-2.5 text-right text-xs text-slate-500">{c.firstPurchase !== Infinity ? formatDate(c.firstPurchase) : '—'}</td>
                <td className="px-4 py-2.5 text-right text-xs text-slate-500">{timeAgo(c.lastPurchase)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
