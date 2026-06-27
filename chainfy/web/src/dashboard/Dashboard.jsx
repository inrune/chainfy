import React, { useMemo } from 'react';
import {
  Sparkles, Plus, Calendar, ChevronDown, Download, ArrowUpRight,
  ChevronRight,
} from 'lucide-react';
import { Button, StatusBadge, ProductThumb } from '../components/ui.jsx';
import { cls, fmtSol, fmtUsd, short, timeAgo, formatDate } from '../lib/format.js';

function StatCard({ label, value, sub, change, accent }) {
  return (
    <div className={cls('rounded-xl border p-4', accent ? 'bg-violet-50/40 border-violet-100' : 'bg-white border-slate-200')}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-2xl font-medium tracking-tight mt-1 font-mono tabular-nums">{value}</div>
      <div className="flex items-center gap-2 mt-1.5">
        {sub && <div className="text-xs text-slate-500">{sub}</div>}
        {typeof change === 'number' && (
          <div className={cls('inline-flex items-center gap-0.5 text-xs font-medium', change >= 0 ? 'text-emerald-600' : 'text-red-600')}>
            <ArrowUpRight className={cls('w-3 h-3', change < 0 && 'rotate-90')} />
            {Math.abs(change).toFixed(0)}%
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard({ state, onPreviewProduct, onLoadSample, onNewProduct, onGoto }) {
  const { transactions, products, store } = state;

  const stats = useMemo(() => {
    const successful = transactions.filter((t) => t.status === 'succeeded');
    const last7 = Date.now() - 7 * 86400000;
    const prev7 = Date.now() - 14 * 86400000;
    const recent = successful.filter((t) => t.createdAt >= last7);
    const prev = successful.filter((t) => t.createdAt >= prev7 && t.createdAt < last7);
    const sum = (arr) => arr.reduce((a, t) => a + t.amount, 0);
    const fees = (arr) => arr.reduce((a, t) => a + t.fee, 0);
    const recentSum = sum(recent);
    const prevSum = sum(prev);
    const pct = prevSum === 0 ? null : ((recentSum - prevSum) / prevSum) * 100;

    const buckets = Array.from({ length: 7 }, (_, i) => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - (6 - i));
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const dayTx = successful.filter((t) => t.createdAt >= start.getTime() && t.createdAt < end.getTime());
      return { day: start.toLocaleDateString('en-US', { weekday: 'short' }), volume: sum(dayTx), count: dayTx.length };
    });

    return {
      grossVolume: recentSum,
      grossPct: pct,
      salesCount: recent.length,
      avgSale: recent.length ? recentSum / recent.length : 0,
      netPayout: recentSum - fees(recent),
      buckets,
      maxVolume: Math.max(...buckets.map((b) => b.volume), 1),
      pendingCount: transactions.filter((t) => t.status === 'pending').length,
    };
  }, [transactions]);

  const recent = transactions.slice(0, 6);

  if (products.length === 0 && transactions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto pt-12 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-violet-100 text-violet-700 mb-4">
          <Sparkles className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-medium tracking-tight mb-1.5">Welcome to {store?.name || 'your store'}</h2>
        <p className="text-sm text-slate-600 mb-6 max-w-md mx-auto">
          Add your first digital product to get a checkout link, or load sample data to explore the dashboard.
        </p>
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" onClick={onLoadSample}>
            <Sparkles className="w-3.5 h-3.5" /> Load sample data
          </Button>
          <Button variant="accent" size="lg" onClick={onNewProduct}>
            <Plus className="w-3.5 h-3.5" /> Create a product
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Home</h1>
          <p className="text-sm text-slate-500 mt-0.5">Last 7 days · ending {formatDate(Date.now())}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="md">
            <Calendar className="w-3.5 h-3.5" /> Last 7 days <ChevronDown className="w-3 h-3 text-slate-400" />
          </Button>
          <Button variant="outline" size="md">
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Gross volume" value={`${fmtSol(stats.grossVolume)} SOL`} sub={`$${fmtUsd(stats.grossVolume)}`} change={stats.grossPct} />
        <StatCard label="Sales" value={stats.salesCount.toLocaleString()} sub={`${stats.pendingCount} pending`} />
        <StatCard label="Average sale" value={`${fmtSol(stats.avgSale)} SOL`} sub={`$${fmtUsd(stats.avgSale)}`} />
        <StatCard label="Net payout" value={`${fmtSol(stats.netPayout)} SOL`} sub="After 1% fee" accent />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="text-xs text-slate-500">Gross volume</div>
            <div className="text-lg font-medium tracking-tight mt-0.5 font-mono tabular-nums">{fmtSol(stats.grossVolume)} SOL</div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-violet-600"></span>
              <span className="text-slate-700">Volume</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-300"></span>
              <span className="text-slate-500">Sales count</span>
            </div>
          </div>
        </div>
        <div className="relative h-44">
          <svg viewBox="0 0 700 180" preserveAspectRatio="none" className="w-full h-full">
            {[40, 90, 140].map((y) => (
              <line key={y} x1="0" y1={y} x2="700" y2={y} stroke="rgb(241 245 249)" strokeWidth="1" />
            ))}
            {stats.buckets.map((b, i) => {
              const x = (i / 6) * 680 + 10;
              const maxCount = Math.max(...stats.buckets.map((bb) => bb.count), 1);
              const h = (b.count / maxCount) * 100;
              return <rect key={i} x={x - 12} y={140 - h} width="24" height={h} fill="rgb(226 232 240)" rx="2" />;
            })}
            <polyline
              points={stats.buckets.map((b, i) => {
                const x = (i / 6) * 680 + 10;
                const y = 140 - (b.volume / stats.maxVolume) * 110;
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke="rgb(124 58 237)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {stats.buckets.map((b, i) => {
              const x = (i / 6) * 680 + 10;
              const y = 140 - (b.volume / stats.maxVolume) * 110;
              return <circle key={i} cx={x} cy={y} r="3" fill="white" stroke="rgb(124 58 237)" strokeWidth="2" />;
            })}
          </svg>
          <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-[10px] text-slate-400 font-mono">
            {stats.buckets.map((b, i) => (
              <div key={i} className="w-8 text-center">{b.day}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-medium">Recent sales</h3>
            <button onClick={() => onGoto('transactions')} className="text-xs text-violet-600 hover:text-violet-700 font-medium flex items-center gap-0.5">
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-slate-400 uppercase tracking-wider">
                <th className="text-left font-medium px-4 py-2">Amount</th>
                <th className="text-left font-medium px-4 py-2">Product</th>
                <th className="text-left font-medium px-4 py-2">Customer</th>
                <th className="text-left font-medium px-4 py-2">Status</th>
                <th className="text-right font-medium px-4 py-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-xs">No sales yet</td></tr>
              )}
              {recent.map((tx) => (
                <tr key={tx.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="px-4 py-2.5 font-medium font-mono tabular-nums">{fmtSol(tx.amount)} SOL</td>
                  <td className="px-4 py-2.5 text-slate-600 truncate max-w-[180px]">{tx.productName}</td>
                  <td className="px-4 py-2.5 text-slate-500 font-mono text-xs">{short(tx.customer)}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={tx.status} /></td>
                  <td className="px-4 py-2.5 text-right text-slate-500 text-xs">{timeAgo(tx.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-medium">Top products</h3>
            <button onClick={() => onGoto('products')} className="text-xs text-violet-600 hover:text-violet-700 font-medium flex items-center gap-0.5">
              All <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {products.slice(0, 4).map((p) => {
              const pt = transactions.filter((t) => t.productId === p.id && t.status === 'succeeded');
              const vol = pt.reduce((a, t) => a + t.amount, 0);
              return (
                <button key={p.id} onClick={() => onPreviewProduct(p)} className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50/60 text-left">
                  <ProductThumb product={p} size={32} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{p.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono tabular-nums mt-0.5">{pt.length} sales · {fmtSol(vol)} SOL</div>
                  </div>
                </button>
              );
            })}
            {products.length === 0 && <div className="px-4 py-6 text-center text-xs text-slate-400">No products yet</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
