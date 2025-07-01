import { PricePoint, TradeSide } from './types';
import ss from 'simple-statistics';

export interface MomentumStrategyOptions {
  window: number; // how many price points to keep
  zThreshold: number; // z-score threshold to trigger trades
}

export class MomentumStrategy {
  private readonly opts: MomentumStrategyOptions;
  private readonly history: Record<string, PricePoint[]> = {};

  constructor(opts: MomentumStrategyOptions) {
    this.opts = opts;
  }

  /**
   * Update price history and decide on trade action.
   * @returns 'buy', 'sell', or null
   */
  public handlePrice(tokenMint: string, price: number): TradeSide | null {
    const arr = (this.history[tokenMint] = this.history[tokenMint] || []);
    arr.push({ timestamp: Date.now(), price });
    if (arr.length > this.opts.window) arr.shift();

    if (arr.length < this.opts.window) return null; // not enough data

    // Compute returns (log returns)
    const returns = [] as number[];
    for (let i = 1; i < arr.length; i++) {
      returns.push(Math.log(arr[i].price / arr[i - 1].price));
    }

    const mean = ss.mean(returns);
    const std = ss.standardDeviation(returns) || 1e-9;
    const latestZ = (returns[returns.length - 1] - mean) / std;

    if (latestZ > this.opts.zThreshold) return 'buy';
    if (latestZ < -this.opts.zThreshold) return 'sell';
    return null;
  }
}