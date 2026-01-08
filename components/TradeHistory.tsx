
import React, { useState } from 'react';
import { TradeRecord, ExpenseRecord, CoinSaleRecord, ActivityRecord, NodeInfo } from '../types';
import { formatCurrency, copperToCurrency, currencyToCopper } from '../utils/currency';
import { Trash2, History, Search, Package, ShoppingCart, Tag, DollarSign, Clock, Pencil, X, Save, MapPin } from 'lucide-react';
import { DEFAULT_NODES } from '../constants';

interface TradeHistoryProps {
  trades: TradeRecord[];
  expenses: ExpenseRecord[];
  coinSales: CoinSaleRecord[];
  onDeleteTrade: (id: string) => void;
  onDeleteExpense: (id: string) => void;
  onDeleteCoinSale: (id: string) => void;
  onUpdateTrade: (updated: TradeRecord) => void;
  onUpdateExpense: (updated: ExpenseRecord) => void;
  onUpdateCoinSale: (updated: CoinSaleRecord) => void;
}

const TradeHistory: React.FC<TradeHistoryProps> = ({ 
  trades, 
  expenses, 
  coinSales, 
  onDeleteTrade, 
  onDeleteExpense,
  onDeleteCoinSale,
  onUpdateTrade,
  onUpdateExpense,
  onUpdateCoinSale
}) => {
  const [filter, setFilter] = useState('');
  const [editingItem, setEditingItem] = useState<ActivityRecord | null>(null);

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
                          <span className="font-black text-slate-200 uppercase text-xs">ПОСТАВКА</span>
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
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-400">
                          <Package size={12} /> {item.packsCount} пак.
                        </div>
                        {item.durationMinutes && (
                          <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                            <Clock size={10} className="text-amber-500/50" /> {item.durationMinutes} мин
                          </div>
                        )}
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
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingItem(item)}
                        className="p-2 text-slate-700 hover:text-sky-400 hover:bg-sky-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Pencil size={16} />
                      </button>
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
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editingItem && (
        <EditModal 
          item={editingItem} 
          onClose={() => setEditingItem(null)} 
          onSaveTrade={onUpdateTrade}
          onSaveExpense={onUpdateExpense}
          onSaveCoinSale={onUpdateCoinSale}
        />
      )}
    </div>
  );
};

interface EditModalProps {
  item: ActivityRecord;
  onClose: () => void;
  onSaveTrade: (item: TradeRecord) => void;
  onSaveExpense: (item: ExpenseRecord) => void;
  onSaveCoinSale: (item: CoinSaleRecord) => void;
}

const EditModal: React.FC<EditModalProps> = ({ item, onClose, onSaveTrade, onSaveExpense, onSaveCoinSale }) => {
  const [tradeData, setTradeData] = useState<Partial<TradeRecord>>(item.type === 'sale' ? item : {});
  const [expenseData, setExpenseData] = useState<Partial<ExpenseRecord>>(item.type === 'expense' ? item : {});
  const [saleData, setSaleData] = useState<Partial<CoinSaleRecord>>(item.type === 'coin_sale' ? item : {});

  // For currency editing
  const getInitialCurrency = () => {
    const val = item.type === 'sale' ? (item as TradeRecord).pricePerPack : (item.type === 'expense' ? (item as ExpenseRecord).amount : (item as CoinSaleRecord).amount);
    return copperToCurrency(val);
  };
  const [gold, setGold] = useState(getInitialCurrency().gold.toString());
  const [silver, setSilver] = useState(getInitialCurrency().silver.toString());
  const [copper, setCopper] = useState(getInitialCurrency().copper.toString());

  const handleSave = () => {
    const copperVal = currencyToCopper(Number(gold) || 0, Number(silver) || 0, Number(copper) || 0);

    if (item.type === 'sale') {
      const updated = {
        ...(item as TradeRecord),
        ...tradeData,
        pricePerPack: copperVal,
        profit: copperVal * (tradeData.packsCount || 1)
      } as TradeRecord;
      onSaveTrade(updated);
    } else if (item.type === 'expense') {
      const updated = {
        ...(item as ExpenseRecord),
        ...expenseData,
        amount: copperVal
      } as ExpenseRecord;
      onSaveExpense(updated);
    } else {
      const updated = {
        ...(item as CoinSaleRecord),
        ...saleData,
        amount: copperVal
      } as CoinSaleRecord;
      onSaveCoinSale(updated);
    }
    onClose();
  };

  const getBorderColor = () => {
    if (item.type === 'sale') return 'border-amber-500/30';
    if (item.type === 'expense') return 'border-rose-500/30';
    return 'border-emerald-500/30';
  };

  const getIcon = () => {
    if (item.type === 'sale') return <Package className="text-amber-500" size={24} />;
    if (item.type === 'expense') return <ShoppingCart className="text-rose-500" size={24} />;
    return <DollarSign className="text-emerald-500" size={24} />;
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 z-[100] flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`bg-slate-900 border ${getBorderColor()} p-8 rounded-[3rem] max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
            {getIcon()} Редактирование
          </h3>
          <button onClick={onClose} className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {item.type === 'sale' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500">Откуда</label>
                  <select 
                    value={tradeData.fromNode} 
                    onChange={e => setTradeData({...tradeData, fromNode: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-bold outline-none"
                  >
                    {DEFAULT_NODES.map(n => <option key={n.id} value={n.name}>{n.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500">Куда</label>
                  <select 
                    value={tradeData.toNode} 
                    onChange={e => setTradeData({...tradeData, toNode: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-bold outline-none"
                  >
                    {DEFAULT_NODES.map(n => <option key={n.id} value={n.name}>{n.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500">Количество паков</label>
                <input 
                  type="number" 
                  value={tradeData.packsCount} 
                  onChange={e => setTradeData({...tradeData, packsCount: Number(e.target.value)})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-black outline-none" 
                />
              </div>
            </>
          )}

          {item.type === 'expense' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500">Метка закупки</label>
              <input 
                type="text" 
                value={expenseData.label} 
                onChange={e => setExpenseData({...expenseData, label: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-bold outline-none" 
              />
            </div>
          )}

          {item.type === 'coin_sale' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500">Цена (USD)</label>
              <input 
                type="number" 
                step="0.01"
                value={saleData.usdPrice} 
                onChange={e => setSaleData({...saleData, usdPrice: Number(e.target.value)})}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-black outline-none" 
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500">
              {item.type === 'sale' ? 'Цена за пак' : 'Сумма монет'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div className="relative">
                <input type="number" value={gold} onChange={e => setGold(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 pr-8 text-white font-black outline-none" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500 font-black">G</span>
              </div>
              <div className="relative">
                <input type="number" value={silver} onChange={e => setSilver(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 pr-8 text-white font-black outline-none" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-black">S</span>
              </div>
              <div className="relative">
                <input type="number" value={copper} onChange={e => setCopper(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 pr-8 text-white font-black outline-none" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-700 font-black">C</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-10">
          <button onClick={onClose} className="flex-1 py-4 bg-slate-800 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:text-white transition-colors">Отмена</button>
          <button onClick={handleSave} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all flex items-center justify-center gap-2">
            <Save size={14} /> Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};

export default TradeHistory;
