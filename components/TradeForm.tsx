
import React, { useState, useEffect, useRef } from 'react';
import { TradeRecord, NodeInfo } from '../types';
import { currencyToCopper, formatCurrency } from '../utils/currency';
import { PlusCircle, MapPin, Coins, Package, Search, ChevronDown, Wallet } from 'lucide-react';

interface TradeFormProps {
  nodes: NodeInfo[];
  onAddTrade: (trade: TradeRecord) => void;
  currentBalance?: number;
}

const TradeForm: React.FC<TradeFormProps> = ({ nodes, onAddTrade, currentBalance }) => {
  const [fromSearch, setFromSearch] = useState('');
  const [toSearch, setToSearch] = useState('');
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  
  const [packsCount, setPacksCount] = useState<string>('1');
  const [gold, setGold] = useState<string>('');
  const [silver, setSilver] = useState<string>('');
  const [copper, setCopper] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fromRef = useRef<HTMLDivElement>(null);
  const toRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fromRef.current && !fromRef.current.contains(event.target as Node)) setShowFromSuggestions(false);
      if (toRef.current && !toRef.current.contains(event.target as Node)) setShowToSuggestions(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredNodes = (search: string) => {
    return nodes.filter(node => node.name.toLowerCase().includes(search.toLowerCase())).slice(0, 6);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const originNode = nodes.find(n => n.name.toLowerCase() === fromSearch.toLowerCase());
    const destNode = nodes.find(n => n.name.toLowerCase() === toSearch.toLowerCase());

    if (!originNode || !destNode) { alert("Выберите города из списка."); return; }

    const pricePerPack = currencyToCopper(Number(gold) || 0, Number(silver) || 0, Number(copper) || 0);
    if (pricePerPack <= 0) { alert("Укажите цену продажи."); return; }

    setIsSubmitting(true);
    const count = Math.max(1, Number(packsCount) || 1);
    const newTrade: TradeRecord = {
      id: crypto.randomUUID(),
      fromNode: originNode.name,
      toNode: destNode.name,
      packsCount: count,
      pricePerPack,
      profit: pricePerPack * count,
      timestamp: new Date().toISOString(),
      type: 'sale',
    };

    onAddTrade(newTrade);
    setGold(''); setSilver(''); setCopper(''); setPacksCount('1');
    setFromSearch(''); setToSearch('');
    setTimeout(() => setIsSubmitting(false), 600);
  };

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500/0 via-amber-500 to-amber-500/0 opacity-50"></div>
      
      <div className="flex justify-between items-start mb-8">
        <h2 className="text-2xl font-black flex items-center gap-3 text-white uppercase italic tracking-tighter">
          <div className="p-2 bg-amber-500/10 rounded-xl">
            <Package className="text-amber-500" size={24} />
          </div>
          Поставка
        </h2>
        {currentBalance !== undefined && currentBalance > 0 && (
          <div className="flex flex-col items-end opacity-60">
            <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Текущий расчет</span>
            <span className="text-[10px] font-black text-amber-500 flex items-center gap-1">
              <Wallet size={10} /> {formatCurrency(currentBalance)}
            </span>
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-5">
          <div className="space-y-2 relative" ref={fromRef}>
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">Откуда</label>
            <div className="relative">
              <input type="text" value={fromSearch} onFocus={() => setShowFromSuggestions(true)} onChange={(e) => setFromSearch(e.target.value)} placeholder="Введите название..." className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-200 font-bold outline-none pl-12" />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
            </div>
            {showFromSuggestions && (
              <div className="absolute z-50 w-full mt-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
                {filteredNodes(fromSearch).map(node => (
                  <button key={node.id} type="button" onClick={() => { setFromSearch(node.name); setShowFromSuggestions(false); }} className="w-full text-left px-5 py-3 text-sm font-bold text-slate-300 hover:bg-amber-500 hover:text-slate-950 transition-colors flex justify-between">
                    {node.name} <span className="text-[10px] opacity-50">{node.region}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2 relative" ref={toRef}>
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">Куда</label>
            <div className="relative">
              <input type="text" value={toSearch} onFocus={() => setShowToSuggestions(true)} onChange={(e) => setToSearch(e.target.value)} placeholder="Введите название..." className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-200 font-bold outline-none pl-12" />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
            </div>
            {showToSuggestions && (
              <div className="absolute z-50 w-full mt-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
                {filteredNodes(toSearch).map(node => (
                  <button key={node.id} type="button" onClick={() => { setToSearch(node.name); setShowToSuggestions(false); }} className="w-full text-left px-5 py-3 text-sm font-bold text-slate-300 hover:bg-amber-500 hover:text-slate-950 transition-colors flex justify-between">
                    {node.name} <span className="text-[10px] opacity-50">{node.region}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5">
           <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Кол-во паков</label>
            <input type="number" value={packsCount} onChange={(e) => setPacksCount(e.target.value)} min="1" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-black outline-none" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Цена за пак</label>
            <div className="grid grid-cols-3 gap-2">
              <div className="relative">
                <input type="number" value={gold} onChange={(e) => setGold(e.target.value)} placeholder="0" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 pr-8 text-white font-black outline-none" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500 font-black">G</span>
              </div>
              <div className="relative">
                <input type="number" value={silver} onChange={(e) => setSilver(e.target.value)} placeholder="0" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 pr-8 text-white font-black outline-none" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-black">S</span>
              </div>
              <div className="relative">
                <input type="number" value={copper} onChange={(e) => setCopper(e.target.value)} placeholder="0" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 pr-8 text-white font-black outline-none" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-700 font-black">C</span>
              </div>
            </div>
          </div>
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full py-5 rounded-2xl font-black uppercase tracking-widest text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:scale-[1.02] active:scale-95 transition-all shadow-xl">
          {isSubmitting ? 'Запись...' : 'Добавить сделку'}
        </button>
      </form>
    </div>
  );
};

export default TradeForm;
