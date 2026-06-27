// Convenience: fund a devnet wallet from the command line.
//   node airdrop.js <WALLET_ADDRESS> [amountSOL]
//
// Devnet's built-in faucet is rate-limited. If this fails, use the web faucet:
//   https://faucet.solana.com   (paste your address, pick devnet)

const { Connection, PublicKey, clusterApiUrl, LAMPORTS_PER_SOL } = require('@solana/web3.js');

async function main() {
  const address = process.argv[2];
  const amount = Number(process.argv[3] || 2);
  if (!address) {
    console.error('Usage: node airdrop.js <WALLET_ADDRESS> [amountSOL]');
    process.exit(1);
  }

  const rpc = process.env.SOLANA_RPC || clusterApiUrl('devnet');
  const connection = new Connection(rpc, 'confirmed');
  const pubkey = new PublicKey(address);

  console.log(`Requesting ${amount} devnet SOL for ${address} ...`);
  try {
    const sig = await connection.requestAirdrop(pubkey, amount * LAMPORTS_PER_SOL);
    const bh = await connection.getLatestBlockhash();
    await connection.confirmTransaction({ signature: sig, ...bh }, 'confirmed');
    const balance = await connection.getBalance(pubkey);
    console.log(`Done. Signature: ${sig}`);
    console.log(`New balance: ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
  } catch (e) {
    console.error('Airdrop failed (faucet may be rate-limited).');
    console.error('Try the web faucet instead: https://faucet.solana.com');
    console.error(String(e.message || e));
    process.exit(1);
  }
}

main();
