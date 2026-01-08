
export interface TradeRecord {
  id: string;
  fromNode: string;
  toNode: string;
  packsCount: number;
  pricePerPack: number; // in copper
  profit: number; // Total profit (packsCount * pricePerPack)
  timestamp: string; // ISO string
  type: 'sale';
  durationMinutes?: number; // Time taken for the trip
}

export interface ExpenseRecord {
  id: string;
  label: string;
  amount: number; // in copper
  timestamp: string; // ISO string
  type: 'expense';
}

export interface CoinSaleRecord {
  id: string;
  amount: number; // amount of copper sold
  usdPrice: number; // price in USD
  timestamp: string;
  type: 'coin_sale';
}

export type ActivityRecord = TradeRecord | ExpenseRecord | CoinSaleRecord;

export interface NodeInfo {
  id: string;
  name: string;
  region: string;
}

export interface RouteStats {
  route: string;
  from: string;
  to: string;
  totalProfit: number;
  count: number;
  avgProfit: number;
  totalPacks: number;
  lastUsed: string;
}

export interface Currency {
  gold: number;
  silver: number;
  copper: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface ActiveTrip {
  startTime: string;
  fromNode: string;
  toNode: string;
}
