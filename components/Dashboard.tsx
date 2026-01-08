
import React from 'react';
import { TradeRecord, ExpenseRecord, CoinSaleRecord, RouteStats } from '../types';
import { formatCurrency } from '../utils/currency';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid, Legend } from 'recharts';
import { TrendingUp, Award, ArrowRightLeft, Target, Wallet, ShoppingCart, DollarSign, Briefcase } from 'lucide-react';

interface DashboardProps {
  trades: TradeRecord[];
  expenses: ExpenseRecord[];
  coinSales: CoinSaleRecord[];
}

const Dashboard: React.FC<DashboardProps> = ({ trades, expenses, coinSales }) => {
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/40 border border-amber-500/20 p-5 rounded-2xl relative overflow-hidden">
          <div className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Выручка (In-Game)</div>
          <div className="text-xl font-black text-amber-500">{formatCurrency(totalProfit)}</div>
          <TrendingUp className="absolute bottom-2 right-2 text-amber-500/10" size={32} />
        </div>
        
        <div className="bg-slate-900/40 border border-emerald-500/40 p-5 rounded-2xl relative overflow-hidden">
          <div className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Выведено в USD</div>
          <div className="text-2xl font-black text-emerald-400">${totalUsdEarned.toFixed(2)}</div>
          <DollarSign className="absolute bottom-2 right-2 text-emerald-500/10" size={32} />
        </div>

        <div className={`bg-slate-900/40 border p-5 rounded-2xl relative overflow-hidden ${netInGameBalance >= 0 ? 'border-sky-500/20' : 'border-rose-500/40'}`}>
          <div className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Чистый остаток (золото)</div>
          <div className={`text-xl font-black ${netInGameBalance >= 0 ? 'text-sky-400' : 'text-rose-500'}`}>
            {formatCurrency(netInGameBalance)}
          </div>
          <Wallet className="absolute bottom-2 right-2 text-sky-500/10" size={32} />
        </div>

        <div className="bg-slate-900/40 border border-rose-500/20 p-5 rounded-2xl relative overflow-hidden">
          <div className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Траты / Закупки</div>
          <div className="text-xl font-black text-rose-400">{formatCurrency(totalExpenses)}</div>
          <ShoppingCart className="absolute bottom-2 right-2 text-rose-500/10" size={32} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Routes Chart */}
        <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl">
          <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-slate-300 mb-6">
            <Award className="text-amber-500" size={16} /> Лучшие Маршруты
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

        <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl flex flex-col justify-center items-center text-center">
           <Briefcase className="text-emerald-500 mb-4" size={48} />
           <h3 className="text-lg font-black uppercase tracking-widest text-white mb-2">Общий профит системы</h3>
           <p className="text-slate-500 text-sm mb-6 max-w-xs">Суммарный объем золота, проданного за реальную валюту и оставшегося в обороте.</p>
           <div className="grid grid-cols-2 gap-8 w-full">
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Продано</div>
                <div className="text-lg font-black text-emerald-400">{formatCurrency(totalGoldSold)}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Курс (G/$)</div>
                <div className="text-lg font-black text-white">
                  {totalUsdEarned > 0 ? (totalGoldSold / 10000 / totalUsdEarned).toFixed(2) : '0'}
                </div>
              </div>
           </div>
        </div>
      </div>

      {/* Analysis Grid */}
      <div className="bg-slate-900/20 border border-slate-800/50 rounded-3xl p-6">
        <h3 className="text-md font-black text-slate-200 mb-6 flex items-center gap-3 uppercase tracking-tighter">
          <Target className="text-amber-500" /> ТОП Эффективных Путей
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
                  <div className="text-slate-500">Ср. золото:</div>
                  <div className="text-emerald-400 text-right">{formatCurrency(stat.avgProfit)}</div>
                  <div className="text-slate-500">Рейсов:</div>
                  <div className="text-sky-400 text-right">{stat.count}</div>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
