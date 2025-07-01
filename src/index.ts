import { Keypair, PublicKey } from '@solana/web3.js';
import dotenv from 'dotenv';
import { initJupiter, executeSwap, JupiterContext } from './jupiter';
import { MomentumStrategy } from './strategy';
import { TradeSide } from './types';

import JSBI from 'jsbi';

dotenv.config();

async function main() {
  if (!process.env.PRIVATE_KEY_ARRAY) {
    throw new Error('PRIVATE_KEY_ARRAY missing in .env');
  }

  const secret = Uint8Array.from(JSON.parse(process.env.PRIVATE_KEY_ARRAY));
  const wallet = Keypair.fromSecretKey(secret);

  console.log(`Loaded wallet: ${wallet.publicKey.toBase58()}`);

  const ctx = await initJupiter(wallet);
  const strategy = new MomentumStrategy({ window: 20, zThreshold: 2 });

  const memes = ctx.tokenList.filter((t) => (t.tags || []).includes('meme'));

  console.log(`Loaded ${memes.length} meme tokens`);

  const slippageBps = parseInt(process.env.SLIPPAGE_BPS || '100', 10);
  const interval = parseInt(process.env.QUOTE_INTERVAL_SEC || '60', 10) * 1000;

  // Price polling loop
  setInterval(async () => {
    for (const token of memes) {
      try {
        const price = await fetchPrice(ctx, token.address);
        const decision = strategy.handlePrice(token.address, price);
        if (!decision) continue;
        await reactToDecision(ctx, token.address, decision, slippageBps);
      } catch (err) {
        console.error('Error processing token', token.symbol, err);
      }
    }
  }, interval);
}

async function fetchPrice(ctx: JupiterContext, outMintStr: string): Promise<number> {
  try {
    const routes = await ctx.jupiter.computeRoutes({
      inputMint: ctx.baseMint,
      outputMint: new PublicKey(outMintStr),
      amount: JSBI.BigInt(1_000_000), // 1 USDC (6 decimals)
      slippageBps: 10,
    });

    if (!routes.routesInfos.length) throw new Error('No quote');
    const best = routes.routesInfos[0];
    const price = JSBI.toNumber(best.outAmount) / JSBI.toNumber(best.inAmount);
    return price;
  } catch (err) {
    console.error('Quote fetch failed', err);
    throw err;
  }
}

async function reactToDecision(
  ctx: JupiterContext,
  tokenMintStr: string,
  side: TradeSide,
  slippageBps: number,
) {
  const tokenMint = new PublicKey(tokenMintStr);
  const base = ctx.baseMint;

  const inMint = side === 'buy' ? base : tokenMint;
  const outMint = side === 'buy' ? tokenMint : base;

  // For demo: 5 USDC per trade
  const amount = 5 * 1_000_000; // 6 decimals

  console.log(`${side.toUpperCase()} ${amount / 1_000_000} ${side === 'buy' ? 'of' : 'for'} ${tokenMintStr}`);
  try {
    await executeSwap(ctx, inMint, outMint, amount, slippageBps);
  } catch (err) {
    console.error('Swap failed', err);
  }
}

main().catch((err) => console.error(err));