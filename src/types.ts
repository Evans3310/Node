export interface TokenInfoExtended {
  address: string;
  symbol: string;
  decimals: number;
  coingeckoId?: string;
  tags?: string[];
}

export interface PricePoint {
  timestamp: number; // Unix ms
  price: number; // in base token (e.g. USDC)
}

export type TradeSide = 'buy' | 'sell';