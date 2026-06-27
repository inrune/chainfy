// On-chain verification. This is the part that makes payments trustworthy:
// we never take the client's word that they paid — we look up the transaction
// signature on devnet and confirm the merchant wallet actually received the SOL.

const {
  Connection,
  PublicKey,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
} = require('@solana/web3.js');

const RPC = process.env.SOLANA_RPC || clusterApiUrl('devnet');
const connection = new Connection(RPC, 'confirmed');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Pull the list of account public keys out of a (possibly versioned) transaction.
function accountKeysOf(tx) {
  const msg = tx.transaction.message;
  if (typeof msg.getAccountKeys === 'function') {
    const keys = msg.getAccountKeys();
    // staticAccountKeys covers everything for a simple SystemProgram transfer
    return keys.staticAccountKeys.map((k) => k.toBase58());
  }
  // Legacy shape
  return msg.accountKeys.map((k) => k.toBase58());
}

/**
 * Confirm that `signature` is a real, successful devnet transaction in which
 * `expectedRecipient` received at least `expectedLamports`.
 *
 * Retries because getTransaction can briefly return null right after a tx
 * confirms (the RPC's history index lags the bank by a moment).
 */
async function verifyPayment({ signature, expectedRecipient, expectedLamports, tries = 10, gapMs = 1500 }) {
  for (let attempt = 0; attempt < tries; attempt++) {
    let tx = null;
    try {
      tx = await connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      });
    } catch (e) {
      // network blip — fall through to retry
    }

    if (tx) {
      if (tx.meta && tx.meta.err) {
        return { ok: false, reason: 'transaction_failed_on_chain' };
      }
      const keys = accountKeysOf(tx);
      const idx = keys.indexOf(expectedRecipient);
      if (idx === -1) {
        return { ok: false, reason: 'recipient_not_found_in_transaction' };
      }
      const pre = tx.meta.preBalances[idx];
      const post = tx.meta.postBalances[idx];
      const received = post - pre;
      // 10 lamport tolerance for any rounding between client and server.
      if (received + 10 < expectedLamports) {
        return {
          ok: false,
          reason: 'underpaid',
          received,
          expected: expectedLamports,
        };
      }
      return { ok: true, received, slot: tx.slot, blockTime: tx.blockTime };
    }

    await sleep(gapMs);
  }
  return { ok: false, reason: 'transaction_not_found_after_retries' };
}

module.exports = { connection, verifyPayment, RPC, LAMPORTS_PER_SOL, PublicKey };
