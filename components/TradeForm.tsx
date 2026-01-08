
import React, { useState } from 'react';
import { AOC_NODES } from '../constants';
import { TradeRecord } from '../types';
import { currencyToCopper } from '../utils/currency';
import { PlusCircle, MapPin, Coins } from 'lucide-react';

interface TradeFormProps {
  onAddTrade: (trade: TradeRecord) => void;
}

const TradeForm: React.FC<TradeFormProps> = ({ onAddTrade }) => {
  const [fromNode, setFromNode] = useState(AOC_NODES[0].name);
  const [toNode, setToNode] = useState(AOC_NODES[1].name);
  const [gold, setGold] = useState<string>('');
  const [silver, setSilver] = useState<string>('');
  const [copper, setCopper] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const g = Number(gold) || 0;
    const s = Number(silver) || 0;
    const c = Number(copper) || 0;
    const totalCopper = currencyToCopper(g, s, c);

    if (totalCopper <= 0) return;

    setIsSubmitting(true);
    const newTrade: TradeRecord = {
      id: crypto.randomUUID(),
      fromNode,
      toNode,
      profit: totalCopper,
      timestamp: new Date().toISOString(),
    };

    onAddTrade(newTrade);
    setGold('');
    setSilver('');
    setCopper('');
    
    setTimeout(() => setIsSubmitting(false), 500);
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-6 rounded-2xl shadow-xl">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-amber-400">
        <PlusCircle size={24} />
        Новая поставка
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-slate-400 flex items-center gap-1">
              <MapPin size={14} /> Откуда
            </label>
            <select
              value={fromNode}
              onChange={(e) => setFromNode(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
            >
              {AOC_NODES.map(node => (
                <option key={node.id} value={node.name}>{node.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-400 flex items-center gap-1">
              <MapPin size={14} className="text-rose-400" /> Куда
            </label>
            <select
              value={toNode}
              onChange={(e) => setToNode(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-rose-500 outline-none transition-all"
            >
              {AOC_NODES.map(node => (
                <option key={node.id} value={node.name}>{node.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-slate-400 flex items-center gap-1 mb-1">
            <Coins size={14} className="text-amber-500" /> Чистая прибыль
          </label>
          <div className="grid grid-cols-3 gap-2">
            <div className="relative">
              <input
                type="number"
                value={gold}
                onChange={(e) => setGold(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 pr-8 text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500 font-bold text-xs">G</span>
            </div>
            <div className="relative">
              <input
                type="number"
                value={silver}
                onChange={(e) => setSilver(e.target.value)}
                max="99"
                placeholder="0"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 pr-8 text-white focus:ring-2 focus:ring-slate-400 outline-none transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">S</span>
            </div>
            <div className="relative">
              <input
                type="number"
                value={copper}
                onChange={(e) => setCopper(e.target.value)}
                max="99"
                placeholder="0"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 pr-8 text-white focus:ring-2 focus:ring-orange-600 outline-none transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-600 font-bold text-xs">C</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3 rounded-lg font-bold text-slate-950 transition-all shadow-lg flex items-center justify-center gap-2 ${
            isSubmitting ? 'bg-amber-600' : 'bg-amber-400 hover:bg-amber-300 active:scale-[0.98]'
          }`}
        >
          {isSubmitting ? 'Запись...' : 'Записать сделку'}
        </button>
      </form>
    </div>
  );
};

export default TradeForm;
