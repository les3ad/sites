
import React, { useState } from 'react';
import { TradeRecord, ExpenseRecord, CoinSaleRecord, ActivityRecord } from '../types';
import { formatCurrency } from '../utils/currency';
import { Trash2, History, Search, Package, ShoppingCart, Tag, DollarSign } from 'lucide-react';

interface TradeHistoryProps {
  trades: TradeRecord[];
  expenses: ExpenseRecord[];
  coinSales: CoinSaleRecord[];
  onDeleteTrade: (id: string) => void;
  onDeleteExpense: (id: string) => void;
  onDeleteCoinSale: (id: string) => void;
}

const TradeHistory: React.FC<TradeHistoryProps> = ({ 
  trades, 
  expenses, 
  coinSales, 
  onDeleteTrade, 
  onDeleteExpense,
  onDeleteCoinSale
}) => {
  const [filter, setFilter] = useState('');

  const allActivity: ActivityRecord[] = [
    ...trades,
    ...expenses,
    ...coinSales
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const filteredActivity = allActivity.filter(item => {
    if (item.type === 'sale') {
      return item.fromNode.toLowerCase().includes(filter.toLowerCase()) || item.toNode.toLowerCase().includes(filter.toLowerCase());
    } else if (item.type === 'expense') {
      return item.label.toLowerCase().includes(filter.toLowerCase());
    } else {
      return 'продажа монет usd'.includes(filter.toLowerCase());
    }
  });

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-500/10 rounded-xl">
            <History size={20} className="text-sky-400" />
          </div>
          <h2 className="text-lg font-black uppercase italic tracking-tighter">Журнал Операций</h2>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input 
            type="text" 
            placeholder="Поиск..." 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-6 py-3 text-sm text-white focus:ring-2 focus:ring-sky-500/50 outline-none w-full md:w-64 transition-all"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] text-slate-500 bg-slate-950 font-black uppercase tracking-widest">
              <th className="px-6 py-4">Тип</th>
              <th className="px-6 py-4">Детали</th>
              <th className="px-6 py-4">Сумма (G/S/C)</th>
              <th className="px-6 py-4">Выгода</th>
              <th className="px-6 py-4 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {filteredActivity.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center text-slate-600 italic">Записей не найдено</td>
              </tr>
            ) : (
              filteredActivity.map(item => (
                <tr key={item.id} className="hover:bg-slate-800/20 transition-all group">
                  <td className="px-6 py-4">
                    {item.type === 'sale' ? (
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                          <Tag size={10} className="text-amber-500" />
                          <span className="font-black text-slate-200 uppercase text-xs">ПРОДАЖА</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">{item.fromNode} → {item.toNode}</span>
                      </div>
                    ) : item.type === 'expense' ? (
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                          <ShoppingCart size={10} className="text-rose-500" />
                          <span className="font-black text-rose-500/80 uppercase text-xs">ЗАКУПКА</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-300">{item.label}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign size={10} className="text-emerald-500" />
                          <span className="font-black text-emerald-500 uppercase text-xs">ЭКСПОРТ (USD)</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">Продажа валюты</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {item.type === 'sale' ? (
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-400">
                        <Package size={12} /> {item.packsCount} пак.
                      </div>
                    ) : item.type === 'expense' ? (
                      <span className="text-[11px] font-medium text-slate-500 italic">Ресурсы</span>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-400 italic">Сделка USD</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {item.type === 'sale' ? (
                      <span className="text-sm font-black text-emerald-400">+{formatCurrency(item.profit)}</span>
                    ) : item.type === 'expense' ? (
                      <span className="text-sm font-black text-rose-500">-{formatCurrency(item.amount)}</span>
                    ) : (
                      <span className="text-sm font-black text-slate-400">-{formatCurrency(item.amount)}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {item.type === 'coin_sale' ? (
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black tracking-widest uppercase">
                        +${item.usdPrice.toFixed(2)}
                      </span>
                    ) : (
                      <div className="flex flex-col text-[10px] font-bold">
                        <span className="text-slate-300">{new Date(item.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="text-slate-600">{new Date(item.timestamp).toLocaleDateString('ru-RU')}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        if (item.type === 'sale') onDeleteTrade(item.id);
                        else if (item.type === 'expense') onDeleteExpense(item.id);
                        else onDeleteCoinSale(item.id);
                      }}
                      className="p-2 text-slate-700 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
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
