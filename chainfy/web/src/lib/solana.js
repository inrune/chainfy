// The real payment. Builds a SystemProgram transfer (two transfers when a
// platform fee wallet is configured: 99% to the merchant, 1% to the platform),
// hands it to the connected wallet to sign + send, and waits for confirmation.

import {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';

// Optional: where the 1% fee goes. If unset, the full amount goes to the
// merchant (the fee is still recorded, just not split out on-chain).
export const PLATFORM_WALLET = import.meta.env.VITE_PLATFORM_WALLET || '';

const FEE_RATE = 0.01;

/**
 * @param connection  from useConnection()
 * @param payer       PublicKey of the connected wallet (publicKey)
 * @param sendTransaction  from useWallet()
 * @param merchantWallet   base58 address that receives the sale
 * @param priceSol         total price in SOL
 * @returns the transaction signature
 */
export async function payForProduct({ connection, payer, sendTransaction, merchantWallet, priceSol }) {
  const fee = priceSol * FEE_RATE;
  const toMerchant = priceSol - fee;

  const instructions = [
    SystemProgram.transfer({
      fromPubkey: payer,
      toPubkey: new PublicKey(merchantWallet),
      lamports: Math.round(toMerchant * LAMPORTS_PER_SOL),
    }),
  ];

  if (PLATFORM_WALLET && fee > 0 && PLATFORM_WALLET !== merchantWallet) {
    instructions.push(
      SystemProgram.transfer({
        fromPubkey: payer,
        toPubkey: new PublicKey(PLATFORM_WALLET),
        lamports: Math.round(fee * LAMPORTS_PER_SOL),
      })
    );
  }

  const tx = new Transaction().add(...instructions);
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = payer;

  const signature = await sendTransaction(tx, connection);
  await connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    'confirmed'
  );

  return signature;
}
