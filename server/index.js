// Chainfy API server
// ------------------
// Source of truth for products, transactions, customers, and store config.
// The important endpoint is POST /api/checkout/confirm — it verifies a real
// devnet transaction on-chain before recording a sale and releasing the
// digital product.

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const db = require('./db');
const { verifyPayment, LAMPORTS_PER_SOL } = require('./solana');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const FEE_RATE = 0.01; // 1% flat

// ---- helpers ---------------------------------------------------------------

function id(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

function makeApiKey(mode) {
  return `sk_${mode}_chainfy_${crypto.randomBytes(18).toString('base64url')}`;
}

function makeLicense(prefix = 'KEY') {
  const block = () => crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${(prefix || 'KEY').toUpperCase()}-${block()}-${block()}-${block()}-${block()}`;
}

function roundLamports(sol) {
  return Math.round(sol * LAMPORTS_PER_SOL);
}

// Best-effort signed webhook. Fire-and-forget so it never blocks a response.
function fireWebhook(store, type, data) {
  if (!store || !store.webhookUrl) return;
  const payload = JSON.stringify({
    id: id('evt'),
    type,
    created: Date.now(),
    data,
  });
  const signature = crypto
    .createHmac('sha256', store.webhookSecret || '')
    .update(payload)
    .digest('hex');

  // Node 18+ has global fetch
  fetch(store.webhookUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-chainfy-signature': signature,
      'x-chainfy-event': type,
    },
    body: payload,
  }).catch(() => {
    /* endpoint down — that's fine for a demo */
  });
}

function ensureStore() {
  const data = db.load();
  if (!data.store) {
    data.store = {
      id: id('store'),
      name: 'My store',
      email: 'you@example.com',
      wallet: '',
      apiKeyTest: makeApiKey('test'),
      apiKeyLive: makeApiKey('live'),
      webhookUrl: '',
      webhookSecret: 'whsec_' + crypto.randomBytes(12).toString('hex'),
      createdAt: Date.now(),
    };
    db.save(data);
  }
  return data.store;
}

// ---- health ----------------------------------------------------------------

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'chainfy', network: 'solana-devnet' });
});

// ---- store -----------------------------------------------------------------

app.get('/api/store', (req, res) => {
  res.json(ensureStore());
});

app.put('/api/store', (req, res) => {
  const data = db.load();
  ensureStore();
  const fresh = db.load();
  fresh.store = { ...fresh.store, ...req.body, id: fresh.store.id };
  db.save(fresh);
  res.json(fresh.store);
});

// Roll API keys
app.post('/api/store/roll-keys', (req, res) => {
  const data = db.load();
  data.store.apiKeyTest = makeApiKey('test');
  data.store.apiKeyLive = makeApiKey('live');
  db.save(data);
  res.json(data.store);
});

// ---- products --------------------------------------------------------------

app.get('/api/products', (req, res) => {
  res.json(db.load().products);
});

app.post('/api/products', (req, res) => {
  const data = db.load();
  const product = {
    id: id('prod'),
    name: req.body.name || 'Untitled product',
    description: req.body.description || '',
    price: Number(req.body.price) || 0,
    type: req.body.type || 'download', // download | license | redirect
    delivery: req.body.delivery || '',
    color: req.body.color || 'violet',
    createdAt: Date.now(),
  };
  data.products.unshift(product);
  db.save(data);
  fireWebhook(data.store, 'product.created', product);
  res.json(product);
});

app.put('/api/products/:id', (req, res) => {
  const data = db.load();
  const i = data.products.findIndex((p) => p.id === req.params.id);
  if (i === -1) return res.status(404).json({ error: 'product_not_found' });
  data.products[i] = {
    ...data.products[i],
    ...req.body,
    id: data.products[i].id,
    price: Number(req.body.price ?? data.products[i].price) || 0,
  };
  db.save(data);
  fireWebhook(data.store, 'product.updated', data.products[i]);
  res.json(data.products[i]);
});

app.delete('/api/products/:id', (req, res) => {
  const data = db.load();
  data.products = data.products.filter((p) => p.id !== req.params.id);
  db.save(data);
  res.json({ ok: true });
});

// Public checkout payload — what the buyer's browser needs. Safe to expose:
// the wallet is a public key meant to receive funds.
app.get('/api/products/:id/checkout', (req, res) => {
  const data = db.load();
  const product = data.products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'product_not_found' });
  if (!data.store || !data.store.wallet) {
    return res.status(400).json({ error: 'store_wallet_not_set' });
  }
  res.json({
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    type: product.type,
    color: product.color,
    merchantWallet: data.store.wallet,
    storeName: data.store.name,
    feeRate: FEE_RATE,
  });
});

// ---- transactions ----------------------------------------------------------

app.get('/api/transactions', (req, res) => {
  res.json(db.load().transactions);
});

// THE important one. Verify a real devnet payment, then record + deliver.
app.post('/api/checkout/confirm', async (req, res) => {
  const { productId, signature, email, customerWallet } = req.body || {};
  if (!productId || !signature) {
    return res.status(400).json({ error: 'missing_productId_or_signature' });
  }

  const data = db.load();
  const product = data.products.find((p) => p.id === productId);
  if (!product) return res.status(404).json({ error: 'product_not_found' });
  if (!data.store || !data.store.wallet) {
    return res.status(400).json({ error: 'store_wallet_not_set' });
  }

  // Idempotency: if we've already recorded this signature, return it.
  const existing = data.transactions.find((t) => t.signature === signature);
  if (existing) {
    return res.json({
      ok: true,
      alreadyProcessed: true,
      transaction: existing,
      delivery: existing.delivery,
      deliveryType: existing.deliveryType,
    });
  }

  const total = product.price;
  const fee = +(total * FEE_RATE).toFixed(9);
  const toMerchant = +(total - fee).toFixed(9);

  // Verify the merchant wallet received at least its cut on devnet.
  const result = await verifyPayment({
    signature,
    expectedRecipient: data.store.wallet,
    expectedLamports: roundLamports(toMerchant),
  });

  if (!result.ok) {
    return res.status(400).json({ error: 'payment_verification_failed', detail: result.reason, info: result });
  }

  // Payment is real. Generate the deliverable.
  const delivery =
    product.type === 'license' ? makeLicense(product.delivery) : product.delivery;

  const tx = {
    id: id('pay'),
    productId: product.id,
    productName: product.name,
    amount: total,
    currency: 'sol',
    fee,
    net: toMerchant,
    status: 'succeeded',
    customer: customerWallet || 'unknown',
    customerEmail: email || 'guest@example.com',
    signature,
    slot: result.slot,
    delivery,
    deliveryType: product.type,
    createdAt: Date.now(),
  };

  data.transactions.unshift(tx);
  db.save(data);

  fireWebhook(data.store, 'payment.succeeded', tx);

  res.json({ ok: true, transaction: tx, delivery, deliveryType: product.type });
});

// ---- customers (derived) ---------------------------------------------------

app.get('/api/customers', (req, res) => {
  const { transactions } = db.load();
  const map = new Map();
  for (const tx of transactions) {
    const key = tx.customer || tx.customerEmail;
    if (!map.has(key)) {
      map.set(key, {
        wallet: tx.customer,
        email: tx.customerEmail,
        totalSpent: 0,
        purchases: 0,
        firstPurchase: Infinity,
        lastPurchase: 0,
      });
    }
    const c = map.get(key);
    if (tx.status === 'succeeded') {
      c.totalSpent += tx.amount;
      c.purchases += 1;
    }
    c.firstPurchase = Math.min(c.firstPurchase, tx.createdAt);
    c.lastPurchase = Math.max(c.lastPurchase, tx.createdAt);
  }
  res.json(
    Array.from(map.values())
      .map((c) => ({ ...c, firstPurchase: c.firstPurchase === Infinity ? null : c.firstPurchase }))
      .sort((a, b) => b.lastPurchase - a.lastPurchase)
  );
});

// ---- demo data + reset -----------------------------------------------------

app.post('/api/seed', (req, res) => {
  const { sampleData } = require('./seed');
  const data = db.load();
  ensureStore();
  const fresh = db.load();
  const seeded = sampleData();
  fresh.products = seeded.products;
  fresh.transactions = seeded.transactions;
  db.save(fresh);
  res.json({ ok: true, products: fresh.products.length, transactions: fresh.transactions.length });
});

app.post('/api/reset', (req, res) => {
  const data = db.load();
  const keepStore = req.body && req.body.keepStore;
  const next = JSON.parse(JSON.stringify(db.EMPTY));
  if (keepStore) next.store = data.store;
  db.save(next);
  res.json({ ok: true });
});

// ---- boot ------------------------------------------------------------------

app.listen(PORT, () => {
  ensureStore();
  console.log(`\n  Chainfy API  ·  http://localhost:${PORT}`);
  console.log(`  Network      ·  solana-devnet`);
  console.log(`  Data file    ·  ${db.DB_PATH}\n`);
});
