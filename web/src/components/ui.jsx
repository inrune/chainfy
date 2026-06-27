import React, { useEffect, useState } from 'react';
import {
  Copy, Check, X, Download, Key, Link as LinkIcon, Package,
  CircleDot, Loader2,
} from 'lucide-react';
import { cls } from '../lib/format.js';

export function Button({ children, variant = 'default', size = 'md', className = '', ...rest }) {
  const sizes = {
    sm: 'h-7 px-2.5 text-xs',
    md: 'h-8 px-3 text-sm',
    lg: 'h-10 px-4 text-sm',
  };
  const variants = {
    default: 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 active:bg-slate-100',
    primary: 'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950',
    accent: 'bg-violet-600 text-white hover:bg-violet-700 active:bg-violet-800',
    ghost: 'text-slate-700 hover:bg-slate-100 active:bg-slate-200 border border-transparent',
    danger: 'text-red-600 hover:bg-red-50 border border-transparent',
    outline: 'bg-transparent text-slate-700 border border-slate-200 hover:bg-slate-50',
  };
  return (
    <button
      {...rest}
      className={cls(
        'inline-flex items-center justify-center gap-1.5 font-medium rounded-md transition-colors whitespace-nowrap disabled:opacity-50 disabled:pointer-events-none',
        sizes[size],
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
}

export function Badge({ children, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-red-50 text-red-700',
    info: 'bg-violet-50 text-violet-700',
  };
  return (
    <span className={cls('inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium rounded', tones[tone])}>
      {children}
    </span>
  );
}

export function Input({ className = '', ...rest }) {
  return (
    <input
      {...rest}
      className={cls(
        'w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded-md outline-none transition-colors',
        'placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20',
        className
      )}
    />
  );
}

export function Textarea({ className = '', ...rest }) {
  return (
    <textarea
      {...rest}
      className={cls(
        'w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-md outline-none transition-colors resize-none',
        'placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20',
        className
      )}
    />
  );
}

export function Label({ children, hint }) {
  return (
    <div className="flex items-center justify-between mb-1.5">
      <label className="text-xs font-medium text-slate-700">{children}</label>
      {hint && <span className="text-xs text-slate-400">{hint}</span>}
    </div>
  );
}

export function CopyField({ value, mono = true }) {
  const [copied, setCopied] = useState(false);
  const onCopy = () => {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <div className="flex items-stretch h-9 border border-slate-200 rounded-md overflow-hidden bg-white">
      <div className={cls('flex-1 px-3 text-sm flex items-center text-slate-700 truncate', mono && 'font-mono text-xs')}>
        {value}
      </div>
      <button
        onClick={onCopy}
        className="px-3 border-l border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors flex items-center"
        aria-label="Copy to clipboard"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

export function Modal({ open, onClose, children, size = 'md' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-3xl' };
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-16 pb-8 overflow-y-auto bg-slate-950/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={cls('w-full bg-white rounded-xl shadow-2xl border border-slate-200', widths[size])}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function ChainfyMark({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" className={className} aria-hidden="true">
      <rect x="2" y="5.5" width="11" height="9" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <rect x="7" y="5.5" width="11" height="9" rx="2.5" fill="currentColor" />
    </svg>
  );
}

export function NavItem({ children, active, onClick, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className={cls(
        'w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left transition-colors',
        active ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      )}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      <span>{children}</span>
    </button>
  );
}

export function ProductThumb({ product, size = 40 }) {
  const palettes = {
    violet: 'bg-violet-100 text-violet-700',
    slate: 'bg-slate-200 text-slate-700',
    amber: 'bg-amber-100 text-amber-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    rose: 'bg-rose-100 text-rose-700',
    sky: 'bg-sky-100 text-sky-700',
  };
  const Icon = { download: Download, license: Key, redirect: LinkIcon }[product?.type] || Package;
  return (
    <div
      className={cls('rounded-md flex items-center justify-center shrink-0', palettes[product?.color] || palettes.violet)}
      style={{ width: size, height: size }}
    >
      <Icon style={{ width: size * 0.45, height: size * 0.45 }} />
    </div>
  );
}

export function ProductTypeBadge({ type }) {
  const map = {
    download: { tone: 'info', label: 'Download', icon: Download },
    license: { tone: 'slate', label: 'License', icon: Key },
    redirect: { tone: 'success', label: 'Access link', icon: LinkIcon },
  };
  const { tone, label, icon: Icon } = map[type] || map.download;
  return (
    <Badge tone={tone}>
      <Icon className="w-2.5 h-2.5" />
      {label}
    </Badge>
  );
}

export function StatusBadge({ status }) {
  if (status === 'succeeded')
    return (
      <Badge tone="success">
        <CircleDot className="w-2.5 h-2.5" />
        Succeeded
      </Badge>
    );
  if (status === 'pending')
    return (
      <Badge tone="warning">
        <Loader2 className="w-2.5 h-2.5 animate-spin" />
        Pending
      </Badge>
    );
  if (status === 'failed')
    return (
      <Badge tone="danger">
        <X className="w-2.5 h-2.5" />
        Failed
      </Badge>
    );
  return <Badge tone="slate">{status}</Badge>;
}

export function Row({ label, value, mono, bold }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="text-slate-500 text-xs">{label}</div>
      <div className={cls('text-right truncate max-w-[60%]', mono && 'font-mono text-xs tabular-nums', bold && 'font-medium')}>
        {value}
      </div>
    </div>
  );
}
