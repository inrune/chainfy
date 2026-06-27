// Sample data generator. These transactions are NOT on-chain — they're
// illustrative history so a fresh dashboard isn't empty. Real sales arrive
// through the verified checkout flow.

const crypto = require('crypto');

function id(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

function fakeWallet() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
  let w = '';
  for (let i = 0; i < 44; i++) w += chars[Math.floor(Math.random() * chars.length)];
  return w;
}

function fakeSignature() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
  let s = '';
  for (let i = 0; i < 88; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function makeLicense(prefix) {
  const block = () => crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${prefix}-${block()}-${block()}-${block()}-${block()}`;
}

function sampleData() {
  const now = Date.now();
  const day = 86400000;

  const products = [
    {
      id: id('prod'),
      name: 'Cosmos Pro — Tailwind theme',
      description: 'A premium Tailwind theme for SaaS landing pages. 12 sections, dark mode, fully responsive.',
      price: 4.5,
      type: 'download',
      delivery: 'https://cdn.example.com/cosmos-pro-v1.2.zip',
      color: 'violet',
      createdAt: now - day * 28,
    },
    {
      id: id('prod'),
      name: 'Lifetime license — Ridgeline IDE',
      description: 'One license per user. Includes 12 months of updates and priority support.',
      price: 12,
      type: 'license',
      delivery: 'RDGL',
      color: 'slate',
      createdAt: now - day * 21,
    },
    {
      id: id('prod'),
      name: '808 Drums Vol. 2 — sample pack',
      description: '120 hand-crafted 808 samples, royalty-free, 24-bit WAV.',
      price: 0.8,
      type: 'download',
      delivery: 'https://cdn.example.com/808-drums-v2.zip',
      color: 'amber',
      createdAt: now - day * 14,
    },
    {
      id: id('prod'),
      name: 'VIP Discord — founders circle',
      description: 'Lifetime access to a private community of indie founders building on Solana.',
      price: 0.25,
      type: 'redirect',
      delivery: 'https://discord.gg/example-invite',
      color: 'emerald',
      createdAt: now - day * 7,
    },
  ];

  const names = ['alex', 'sam', 'jordan', 'morgan', 'taylor', 'casey', 'riley', 'avery', 'quinn', 'rowan', 'sasha', 'devon', 'eli', 'nico', 'shay', 'jamie', 'kai', 'remy'];
  const domains = ['gmail.com', 'protonmail.com', 'fastmail.com', 'hey.com'];
  const customers = Array.from({ length: 16 }, () => ({
    wallet: fakeWallet(),
    email: `${names[Math.floor(Math.random() * names.length)]}.${Math.floor(Math.random() * 999)}@${domains[Math.floor(Math.random() * domains.length)]}`,
  }));

  const transactions = [];
  for (let i = 0; i < 34; i++) {
    const product = products[Math.floor(Math.random() * products.length)];
    const cust = customers[Math.floor(Math.random() * customers.length)];
    const daysBack = Math.pow(Math.random(), 1.5) * 7;
    const ts = now - daysBack * day - Math.random() * 3600000;
    const roll = Math.random();
    const status = roll < 0.04 ? 'failed' : roll < 0.09 ? 'pending' : 'succeeded';
    transactions.push({
      id: id('pay'),
      productId: product.id,
      productName: product.name,
      amount: product.price,
      currency: 'sol',
      fee: +(product.price * 0.01).toFixed(4),
      net: +(product.price * 0.99).toFixed(4),
      status,
      customer: cust.wallet,
      customerEmail: cust.email,
      signature: fakeSignature(),
      delivery: status === 'succeeded' ? (product.type === 'license' ? makeLicense(product.delivery) : product.delivery) : null,
      deliveryType: product.type,
      createdAt: ts,
    });
  }
  transactions.sort((a, b) => b.createdAt - a.createdAt);

  return { products, transactions };
}

// Allow `npm run seed` to write directly to the db too.
if (require.main === module) {
  const db = require('./db');
  const data = db.load();
  const seeded = sampleData();
  data.products = seeded.products;
  data.transactions = seeded.transactions;
  if (!data.store) {
    data.store = {
      id: id('store'),
      name: 'Pixel Theme Co.',
      email: 'demo@chainfy.dev',
      wallet: '',
      apiKeyTest: `sk_test_chainfy_${crypto.randomBytes(18).toString('base64url')}`,
      apiKeyLive: `sk_live_chainfy_${crypto.randomBytes(18).toString('base64url')}`,
      webhookUrl: '',
      webhookSecret: 'whsec_' + crypto.randomBytes(12).toString('hex'),
      createdAt: Date.now(),
    };
  }
  db.save(data);
  console.log(`Seeded ${seeded.products.length} products and ${seeded.transactions.length} transactions.`);
}

module.exports = { sampleData };
