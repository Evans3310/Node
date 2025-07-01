import { describe, expect, it } from 'vitest';
import { MomentumStrategy } from '../src/strategy';

describe('MomentumStrategy', () => {
  it('signals buy on strong positive momentum', () => {
    const strategy = new MomentumStrategy({ window: 5, zThreshold: 1 });
    const mint = 'testmint';
    const prices = [1, 1.01, 1.02, 1.03, 1.5];
    let signal: ReturnType<typeof strategy.handlePrice> | null = null;
    prices.forEach((p) => {
      signal = strategy.handlePrice(mint, p);
    });
    expect(signal).toBe('buy');
  });

  it('signals sell on strong negative momentum', () => {
    const strategy = new MomentumStrategy({ window: 5, zThreshold: 1 });
    const mint = 'testmint2';
    const prices = [1, 0.99, 0.98, 0.97, 0.5];
    let signal: ReturnType<typeof strategy.handlePrice> | null = null;
    prices.forEach((p) => {
      signal = strategy.handlePrice(mint, p);
    });
    expect(signal).toBe('sell');
  });
});