
import React from 'react';
import { TradeRecord, RouteStats } from '../types';
import { formatCurrency } from '../utils/currency';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Award } from 'lucide-react';

interface DashboardProps {
  trades: TradeRecord[];
}

const Dashboard: React.FC<DashboardProps> = ({ trades }) => {
  const getRouteStats = (): RouteStats[] => {
    const map = new Map<string, { total: number; count: number }>();
    trades.forEach(t => {
      const key = `${t.fromNode} → ${t.toNode}`;
      const existing = map.get(key) || { total: 0, count: 0 };
      map.set(key, { total: existing.total + t.profit, count: existing.count + 1 });
    });

    return Array.from(map.entries()).map(([route, data]) => ({
      route,
      totalProfit: data.total,
      count: data.count,
      avgProfit: Math.round(data.total / data.count)
    })).sort((a, b) => b.avgProfit - a.avgProfit).slice(0, 5);
  };

  const getTimeSeries = () => {
    return trades.slice(-10).map(t => ({
      time: new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      profit: Math.round(t.profit / 100) / 100 // Display as gold decimal for chart
    }));
  };

  const stats = getRouteStats();
  const timeData = getTimeSeries();
  const totalProfit = trades.reduce((sum, t) => sum + t.profit, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <div className="text-slate-400 text-xs mb-1 uppercase font-bold tracking-tighter">Общая прибыль</div>
          <div className="text-xl font-bold text-amber-400">
            {formatCurrency(totalProfit)}
          </div>
        </div>
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <div className="text-slate-400 text-xs mb-1 uppercase font-bold tracking-tighter">Всего рейсов</div>
          <div className="text-2xl font-bold text-sky-400">{trades.length}</div>
        </div>
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <div className="text-slate-400 text-xs mb-1 uppercase font-bold tracking-tighter">Среднее за рейс</div>
          <div className="text-xl font-bold text-emerald-400">
            {trades.length ? formatCurrency(Math.round(totalProfit / trades.length)) : '0м'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Award className="text-yellow-500" size={20} />
            Самые выгодные маршруты
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats} layout="vertical">
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="route" 
                  type="category" 
                  width={150} 
                  tick={{ fill: '#94a3b8', fontSize: 10 }} 
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}
                  itemStyle={{ color: '#fbbf24' }}
                />
                <Bar dataKey="avgProfit" radius={[0, 4, 4, 0]}>
                  {stats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`rgba(251, 191, 36, ${1 - index * 0.15})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="text-emerald-500" size={20} />
            Динамика прибыли (в золоте)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeData}>
                <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis hide />
                <Tooltip 
                  formatter={(value: number) => `${value.toFixed(2)}з`}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#10b981' }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
