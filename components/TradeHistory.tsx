
import React from 'react';
import { TradeRecord } from '../types';
import { formatCurrency } from '../utils/currency';
import { Trash2, History, ArrowRight } from 'lucide-react';

interface TradeHistoryProps {
  trades: TradeRecord[];
  onDelete: (id: string) => void;
}

const TradeHistory: React.FC<TradeHistoryProps> = ({ trades, onDelete }) => {
  const sortedTrades = [...trades].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
        <h2 className="font-bold flex items-center gap-2">
          <History size={18} className="text-sky-400" />
          История караванов
        </h2>
        <span className="text-xs text-slate-500">Записей: {trades.length}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-xs text-slate-400 bg-slate-950/50">
              <th className="px-6 py-3 font-semibold uppercase tracking-wider">Маршрут</th>
              <th className="px-6 py-3 font-semibold uppercase tracking-wider">Прибыль</th>
              <th className="px-6 py-3 font-semibold uppercase tracking-wider">Дата и время</th>
              <th className="px-6 py-3 font-semibold text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {sortedTrades.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic">
                  Пока нет данных о торговле. Время снаряжать караван!
                </td>
              </tr>
            ) : (
              sortedTrades.map(trade => (
                <tr key={trade.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{trade.fromNode}</span>
                      <ArrowRight size={14} className="text-slate-600" />
                      <span className="font-medium text-amber-200">{trade.toNode}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-amber-400 font-bold whitespace-nowrap">{formatCurrency(trade.profit)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-slate-400">
                      {new Date(trade.timestamp).toLocaleDateString('ru-RU')}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {new Date(trade.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onDelete(trade.id)}
                      className="p-2 text-slate-600 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TradeHistory;
