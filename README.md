# Solana Meme-Coin AI Trader
This project implements an automated trading agent that swaps **meme coins** on the Solana blockchain. It combines:

1. **Market data** from Jupiter Aggregator (best-rate DEX router on Solana).
2. **A simple statistical model** that tries to exploit short-term momentum in highly volatile tokens.
3. **On-chain execution** of swaps via Jupiter routes with configurable slippage.

The architecture is intentionally modular so you can plug in more sophisticated AI/ML strategies later.

## Features
- Fetches real-time quotes for every token tagged `meme` on the official Jupiter token list.
- Maintains a rolling price history in memory.
- Computes a momentum score and decides to **BUY** or **SELL** based on configurable thresholds.
- Executes swaps atomically through Jupiter V6 routing.
- Written in **TypeScript** – runs directly with `ts-node`.

## Quick Start
1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Create a wallet** (or import an existing one) and fund it with a small amount of SOL for gas and USDC for trading.
3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # then edit .env with your RPC endpoint & private key
   ```
4. **Run the bot**
   ```bash
   npm start
   ```

## Configuration
| Variable | Description |
|----------|-------------|
| `RPC_ENDPOINT` | Solana RPC URL (mainnet recommended). |
| `PRIVATE_KEY_ARRAY` | JSON array representing the secret key of your wallet. Never commit this! |
| `SLIPPAGE_BPS` | Max slippage in basis points when swapping. 100 = 1%. |
| `QUOTE_INTERVAL_SEC` | Seconds between price polls. |
| `BASE_SYMBOL` / `BASE_MINT` | The token you keep as cash (default USDC). |

## Strategy
The default strategy is a **naïve momentum** approach:

1. Track the last 20 midpoint prices for each meme token.
2. Compute a z-score of the most recent return relative to the rolling standard deviation.
3. If `z > +2` we **BUY** (expecting breakout); if `z < −2` we **SELL** (take profit or cut loss).

You can modify `strategy.ts` or add your own modules to implement RL or deep-learning policies.

## Safety Controls
- Each trade size is capped at 5 % of the bot's USDC balance.
- Slippage is enforced via Jupiter so failed routes revert.
- Optional dry-run mode coming soon.

## Folder Structure
```
├── src
│   ├── index.ts          # entry point
│   ├── jupiter.ts        # Jupiter client helper
│   ├── strategy.ts       # simple momentum strategy
│   └── types.ts          # shared types
```
