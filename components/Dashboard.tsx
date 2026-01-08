
import React, { useState } from 'react';
import { TradeRecord, ExpenseRecord, CoinSaleRecord, RouteStats } from '../types';
import { formatCurrency } from '../utils/currency';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid, Legend, LineChart, Line } from 'recharts';
import { TrendingUp, Award, ArrowRightLeft, Target, Wallet, ShoppingCart, DollarSign, Briefcase, Clock, Activity } from 'lucide-react';

interface DashboardProps {
  trades: TradeRecord[];
  expenses: ExpenseRecord[];
  coinSales: CoinSaleRecord[];
}

const Dashboard: React.FC<DashboardProps> = ({ trades, expenses, coinSales }) => {
  const [selectedVolatilityRoute, setSelectedVolatilityRoute] = useState<string | null>(null);

  const getRouteStats = (): RouteStats[] => {
    const map = new Map<string, { total: number; count: number; packs: number; lastUsed: string; from: string; to: string }>();
    trades.forEach(t => {
      const key = `${t.fromNode} → ${t.toNode}`;
      const existing = map.get(key) || { total: 0, count: 0, packs: 0, lastUsed: t.timestamp, from: t.fromNode, to: t.toNode };
      map.set(key, { 
        total: existing.total + t.profit, 
        count: existing.count + 1,
        packs: existing.packs + t.packsCount,
        lastUsed: new Date(t.timestamp) > new Date(existing.lastUsed) ? t.timestamp : existing.lastUsed,
        from: t.fromNode,
        to: t.toNode
      });
    });

    return Array.from(map.entries()).map(([route, data]) => ({
      route,
      from: data.from,
      to: data.to,
      totalProfit: data.total,
      count: data.count,
      totalPacks: data.packs,
      avgProfit: Math.round(data.total / data.count),
      lastUsed: data.lastUsed
    })).sort((a, b) => b.avgProfit - a.avgProfit).slice(0, 5);
  };

  const stats = getRouteStats();
  const totalProfit = trades.reduce((sum, t) => sum + t.profit, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalUsdEarned = coinSales.reduce((sum, s) => sum + s.usdPrice, 0);
  const totalGoldSold = coinSales.reduce((sum, s) => sum + s.amount, 0);
  const netInGameBalance = totalProfit - totalExpenses - totalGoldSold;

  // PLN/hr Calculation
  const getPlnHr = () => {
    const tradesWithTime = trades.filter(t => t.durationMinutes && t.durationMinutes > 0);
    if (tradesWithTime.length === 0) return 0;
    
    const totalDurationMin = tradesWithTime.reduce((sum, t) => sum + (t.durationMinutes || 0), 0);
    const totalCopperWithTime = tradesWithTime.reduce((sum, t) => sum + t.profit, 0);
    
    // Convert copper to USD estimate based on sales, then to PLN
    const avgRate = totalUsdEarned > 0 ? (totalUsdEarned / (totalGoldSold / 10000)) : 0.005; // Default if no sales
    const estimatedUsd = (totalCopperWithTime / 10000) * avgRate;
    const estimatedPln = estimatedUsd * 4.10;
    
    return (estimatedPln / (totalDurationMin / 60)).toFixed(2);
  };

  // Volatility Data for selected or top route
  const getVolatilityData = () => {
    const route = selectedVolatilityRoute || (stats[0]?.route);
    if (!route) return [];
    
    return trades
      .filter(t => `${t.fromNode} → ${t.toNode}` === route)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(t => ({
        time: new Date(t.timestamp).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
        price: t.pricePerPack / 10000, // Gold
        raw: t.pricePerPack
      }));
  };

  const volatilityData = getVolatilityData();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/40 border border-amber-500/20 p-5 rounded-2xl relative overflow-hidden group">
          <div className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Выручка (G)</div>
          <div className="text-xl font-black text-amber-500">{formatCurrency(totalProfit)}</div>
          <TrendingUp className="absolute bottom-2 right-2 text-amber-500/10 group-hover:scale-110 transition-transform" size={32} />
        </div>
        
        <div className="bg-slate-900/40 border border-emerald-500/40 p-5 rounded-2xl relative overflow-hidden group">
          <div className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Выведено в USD</div>
          <div className="text-2xl font-black text-emerald-400">${totalUsdEarned.toFixed(2)}</div>
          <DollarSign className="absolute bottom-2 right-2 text-emerald-500/10 group-hover:scale-110 transition-transform" size={32} />
        </div>

        <div className={`bg-slate-900/40 border p-5 rounded-2xl relative overflow-hidden group ${netInGameBalance >= 0 ? 'border-sky-500/20' : 'border-rose-500/40'}`}>
          <div className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Остаток в PLN/hr</div>
          <div className="text-xl font-black text-sky-400 flex items-center gap-2">
            <span className="text-xs text-sky-600">zł</span>{getPlnHr()}/ч
          </div>
          <Clock className="absolute bottom-2 right-2 text-sky-500/10 group-hover:scale-110 transition-transform" size={32} />
        </div>

        <div className="bg-slate-900/40 border border-rose-500/20 p-5 rounded-2xl relative overflow-hidden group">
          <div className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Закупки</div>
          <div className="text-xl font-black text-rose-400">{formatCurrency(totalExpenses)}</div>
          <ShoppingCart className="absolute bottom-2 right-2 text-rose-500/10 group-hover:scale-110 transition-transform" size={32} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Price Volatility Chart */}
        <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-slate-300">
              <Activity className="text-amber-500" size={16} /> Волатильность цен
            </h3>
            <select 
              className="bg-slate-950 border border-slate-800 text-[10px] font-black text-amber-500 rounded-lg px-3 py-1 outline-none"
              onChange={(e) => setSelectedVolatilityRoute(e.target.value)}
              value={selectedVolatilityRoute || stats[0]?.route}
            >
              {stats.map(s => <option key={s.route} value={s.route}>{s.route}</option>)}
            </select>
          </div>
          <div className="h-[250px] w-full">
            {volatilityData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volatilityData}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" hide />
                  <YAxis domain={['auto', 'auto']} tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Tooltip 
                    formatter={(value: number, name: string, props: any) => [formatCurrency(props.payload.raw), 'Цена']}
                    contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px' }}
                  />
                  <Area type="monotone" dataKey="price" stroke="#f59e0b" fillOpacity={1} fill="url(#colorPrice)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 text-[10px] uppercase font-bold italic">
                Недостаточно данных для графика
              </div>
            )}
          </div>
        </div>

        {/* Top Routes Ranking */}
        <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl">
          <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-slate-300 mb-6">
            <Award className="text-amber-500" size={16} /> Рейтинг маршрутов
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="route" type="category" width={120} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px' }}
                />
                <Bar dataKey="avgProfit" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Efficiency Analysis Table */}
      <div className="bg-slate-900/20 border border-slate-800/50 rounded-3xl p-6">
        <h3 className="text-md font-black text-slate-200 mb-6 flex items-center gap-3 uppercase tracking-tighter">
          <Target className="text-amber-500" /> Анализ эффективности
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-slate-950/50 border border-slate-800 p-4 rounded-2xl group hover:border-amber-500/30 transition-all">
               <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center text-[10px] font-black text-amber-500">
                    {idx + 1}
                  </div>
                  <div className="flex items-center gap-1 overflow-hidden text-[11px]">
                    <span className="font-bold text-slate-300 truncate">{stat.from}</span>
                    <ArrowRightLeft size={10} className="text-slate-600 shrink-0" />
                    <span className="font-bold text-amber-400 truncate">{stat.to}</span>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-2 text-[10px] uppercase font-bold">
                  <div className="text-slate-500">Средний G:</div>
                  <div className="text-emerald-400 text-right">{formatCurrency(stat.avgProfit)}</div>
                  <div className="text-slate-500">Объем:</div>
                  <div className="text-sky-400 text-right">{stat.totalPacks} пак.</div>
                  <div className="text-slate-500">Популярность:</div>
                  <div className="text-amber-500 text-right">{stat.count} рейсов</div>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
