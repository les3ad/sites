
export interface TradeRecord {
  id: string;
  fromNode: string;
  toNode: string;
  profit: number; // Total value in copper
  timestamp: string; // ISO string
  notes?: string;
}

export interface NodeInfo {
  id: string;
  name: string;
  region: string;
}

export interface RouteStats {
  route: string;
  totalProfit: number;
  count: number;
  avgProfit: number;
}

export interface Currency {
  gold: number;
  silver: number;
  copper: number;
}
