# Chainfy

Accept **real Solana payments** for digital products — file downloads, license keys, and gated access links. Runs entirely on **Solana devnet**, so every payment is a genuine on-chain transaction but the SOL has no real value.

It's two apps:

- **`server/`** — the backend. Stores products and sales, and **verifies every payment on-chain** before delivering the product. Also sends signed webhooks.
- **`web/`** — the dashboard (manage products, see sales) and the customer checkout (connect a wallet, pay).

---

## What you need first

1. **Node.js 18 or newer** — check with `node -v`. Get it at [nodejs.org](https://nodejs.org).
2. **A Solana wallet browser extension** — [Phantom](https://phantom.app) or [Solflare](https://solflare.com). After installing, **switch it to Devnet** (Settings → Developer Settings → Change Network → Devnet).

That's it. No database, no accounts, no API keys to sign up for.

---

## Setup (about 3 minutes)

You'll run **two terminals** — one for the backend, one for the frontend.

### Terminal 1 — backend

```bash
cd chainfy/server
npm install
npm start
```

You should see `Chainfy API · http://localhost:4000`.

### Terminal 2 — frontend

```bash
cd chainfy/web
npm install
npm run dev
```

Open the URL it prints — **http://localhost:5173**.

> Prefer one command? From the `chainfy/` root: `npm run install:all`, then run `npm run server` and `npm run web` in separate terminals.

---

## First-time configuration

1. Open **http://localhost:5173** → go to **Settings**.
2. Paste your **payout wallet** — your wallet's devnet address (copy it from Phantom/Solflare). **All sales settle here.**
3. Click **Save changes**.

Optional: click **Load sample data** (in Settings or on the empty Home screen) to fill the dashboard with example products and history so it isn't empty.

---

## Get free devnet SOL

To test a purchase you need devnet SOL in the **buyer** wallet.

- **Easiest:** go to [faucet.solana.com](https://faucet.solana.com), paste your address, pick **devnet**, request SOL.
- **From the command line:**
  ```bash
  cd chainfy/server
  npm run airdrop -- <YOUR_WALLET_ADDRESS> 2
  ```
  (The faucet is rate-limited; if it fails, use the website.)

---

## The full test loop

1. **Create a product** — click **New product**. Set a name, a price in SOL, and a delivery method:
   - **File download** — an HTTPS link to your file
   - **License key** — a unique key is generated per sale
   - **Access link** — e.g. a Discord invite
2. **Open the checkout** — on the product row, click the **eye icon** (or copy the link with the chain icon). It opens `/c/<product-id>`.
3. **Pay** — enter an email, click **Connect wallet**, pick Phantom/Solflare, then **Pay**. Approve the transaction in your wallet.
4. **Watch it verify** — the backend looks up your transaction signature on devnet, confirms the SOL actually arrived, then unlocks the product (key / download / link). There's a **View on Solana Explorer** link to see the real transaction.
5. **See the sale** — back in the dashboard, it appears under **Sales**, the buyer shows up under **Customers**, and an event lands in **Event logs**.

Because verification is on-chain, the dashboard only records sales that genuinely happened.

---

## The 1% fee (and how to make the split real)

Chainfy charges a flat **1%**. By default the buyer sends the full price to your payout wallet, and the 1% is tracked in the records.

To make the split happen **on-chain** (99% to the merchant, 1% to a platform wallet in the same transaction):

1. Create or pick a **second devnet address** you control.
2. In `web/`, copy `.env.example` to `.env` and set:
   ```
   VITE_PLATFORM_WALLET=<your-platform-devnet-address>
   ```
3. Restart `npm run dev`.

Now every payment is two transfers in one transaction, and you'll see both on Solana Explorer.

---

## Webhooks (optional)

Want your own system to react when someone pays?

1. In the dashboard → **API & webhooks**, set your endpoint URL and save.
2. Chainfy POSTs events (`payment.succeeded`, `product.created`, …) to that URL.
3. Each request includes an `x-chainfy-signature` header — an HMAC-SHA256 of the body using your **signing secret**. Verify it before trusting the event. There's a ready-to-copy Node snippet on that screen.

---

## Project layout

```
chainfy/
├── server/              backend (source of truth + on-chain verification)
│   ├── index.js         Express API + routes
│   ├── solana.js        verifies payments on devnet
│   ├── db.js            JSON-file storage (data.json)
│   ├── seed.js          sample data  (npm run seed)
│   └── airdrop.js       fund a wallet (npm run airdrop)
└── web/                 dashboard + checkout
    └── src/
        ├── App.jsx          shell + routing (/c/:id = checkout)
        ├── checkout/        real wallet payment flow
        ├── dashboard/       home, products, sales, customers, dev, settings
        ├── lib/solana.js    builds + sends the devnet transaction
        └── api.js           talks to the backend
```

Data lives in `server/data.json`. Delete that file (or use **Settings → Reset**) to start fresh.

---

## Troubleshooting

- **"Can't reach the Chainfy API"** — the backend isn't running. Start Terminal 1 (`cd server && npm start`).
- **No wallets in the connect popup** — install Phantom or Solflare and make sure the extension is enabled, then refresh.
- **"Not enough devnet SOL"** — fund the buyer wallet from the faucet (see above).
- **Payment verification fails** — devnet RPC can lag; the backend retries for ~15s. If it still fails, the public RPC may be congested — try again, or set `SOLANA_RPC` in `server/.env` to a dedicated devnet endpoint (Helius/QuickNode).
- **Wallet shows the wrong network** — switch the extension to **Devnet**.

---

## Notes on going to mainnet

This is a devnet build. To take it live you would, at minimum:

- Switch the cluster from `devnet` to `mainnet-beta` (in `server/solana.js` and `web/src/main.jsx`, or via the `SOLANA_RPC` / `VITE_SOLANA_RPC` env vars) and use a paid RPC provider.
- Replace the JSON-file store with a real database (Postgres/SQLite).
- Add authentication for the dashboard, rate limiting, and proper secret management.
- Treat the on-chain amounts as real money and audit the verification logic carefully.

On mainnet the SOL is real — test thoroughly on devnet first.

---

Built with React, Vite, Express, and `@solana/web3.js` + the Solana Wallet Adapter.
