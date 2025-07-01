import { Connection, Keypair, PublicKey, VersionedTransaction } from '@solana/web3.js';
import { Jupiter, RouteInfo, TOKEN_LIST_URL } from '@jup-ag/core';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { TokenInfoExtended } from './types';
import JSBI from 'jsbi';

dotenv.config();

export interface JupiterContext {
  jupiter: Jupiter;
  connection: Connection;
  baseMint: PublicKey;
  tokenList: TokenInfoExtended[];
}

export async function initJupiter(wallet: Keypair): Promise<JupiterContext> {
  const connection = new Connection(process.env.RPC_ENDPOINT as string, {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 60_000,
  });

  const jupiter = await Jupiter.load({
    connection,
    cluster: 'mainnet-beta',
    user: wallet,
  });

  const tokens: TokenInfoExtended[] = await (
    await fetch(TOKEN_LIST_URL['mainnet-beta'])
  ).json();

  const baseMint = new PublicKey(process.env.BASE_MINT as string);

  return { jupiter, connection, baseMint, tokenList: tokens };
}

export async function executeSwap(
  ctx: JupiterContext,
  inMint: PublicKey,
  outMint: PublicKey,
  amount: number,
  slippageBps: number,
): Promise<string | null> {
  const routes = await ctx.jupiter.computeRoutes({
    inputMint: inMint,
    outputMint: outMint,
    amount: JSBI.BigInt(amount),
    slippageBps,
  });

  if (!routes.routesInfos.length) {
    console.warn('No swap routes found');
    return null;
  }

  const bestRoute: RouteInfo = routes.routesInfos[0];
  const { execute } = await ctx.jupiter.exchange({ routeInfo: bestRoute });
  const { txid } = await execute();
  console.log(`Swapped ${amount} in ${inMint.toBase58()} -> ${outMint.toBase58()} | tx: ${txid}`);
  return txid;
}