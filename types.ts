export enum AssetType {
  Stock = 'Stock',
  Bond = 'Bond',
  Cash = 'Cash'
}

export interface Holding {
  name: string;
  shares: number;
  totalProfitLoss: number;
  avgPrice: number;
  currentPrice: number;
  currentValue: number;
  cost: number;
  returnRate: number;
  type: AssetType;
}

export interface PortfolioSummary {
  totalAssets: number;
  totalInvested: number;
  totalCash: number;
  stockValue: number;
  bondValue: number;
  totalProfitLoss: number;
  holdings: Holding[];
}

export interface RebalanceTarget {
  targetTotalAssets: number;
  targetInvestedAmount: number; // 7,000,000
  targetReserveCash: number;    // 1,000,000
  stockRatio: number;           // 0.6
  bondRatio: number;            // 0.4
}