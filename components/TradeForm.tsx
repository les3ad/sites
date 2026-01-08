
import React, { useState, useEffect, useRef } from 'react';
import { TradeRecord, NodeInfo, ActiveTrip } from '../types';
import { currencyToCopper, formatCurrency } from '../utils/currency';
import { PlusCircle, MapPin, Coins, Package, Search, ChevronDown, Wallet, Clock, Play, Flag, Star, X } from 'lucide-react';

interface TradeFormProps {
  nodes: NodeInfo[];
  trades: TradeRecord[];
  onAddTrade: (trade: TradeRecord) => void;
  currentBalance?: number;
}

const TradeForm: React.FC<TradeFormProps> = ({ nodes, trades, onAddTrade, currentBalance }) => {
  const [fromSearch, setFromSearch] = useState('');
  const [toSearch, setToSearch] = useState('');
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  
  const [packsCount, setPacksCount] = useState<string>('3');
  const [gold, setGold] = useState<string>('');
  const [silver, setSilver] = useState<string>('');
  const [copper, setCopper] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Travel Time State
  const [activeTrip, setActiveTrip] = useState<ActiveTrip | null>(() => {
    const saved = localStorage.getItem('aoc_active_trip');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [elapsedTime, setElapsedTime] = useState<string>('00:00');

  const fromRef = useRef<HTMLDivElement>(null);
  const toRef = useRef<HTMLDivElement>(null);

  // Stopwatch Logic
  useEffect(() => {
    let interval: number | undefined;
    if (activeTrip) {
      const updateTimer = () => {
        const diff = new Date().getTime() - new Date(activeTrip.startTime).getTime();
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setElapsedTime(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      };
      updateTimer();
      interval = window.setInterval(updateTimer, 1000);
    } else {
      setElapsedTime('00:00');
    }
    return () => clearInterval(interval);
  }, [activeTrip]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fromRef.current && !fromRef.current.contains(event.target as Node)) setShowFromSuggestions(false);
      if (toRef.current && !toRef.current.contains(event.target as Node)) setShowToSuggestions(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (activeTrip) {
      localStorage.setItem('aoc_active_trip', JSON.stringify(activeTrip));
      setFromSearch(activeTrip.fromNode);
      setToSearch(activeTrip.toNode);
    } else {
      localStorage.removeItem('aoc_active_trip');
    }
  }, [activeTrip]);

  const filteredNodes = (search: string) => {
    return nodes.filter(node => node.name.toLowerCase().includes(search.toLowerCase())).slice(0, 6);
  };

  const getFavoriteRoutes = () => {
    const routes = new Map<string, { from: string, to: string, count: number }>();
    trades.forEach(t => {
      const key = `${t.fromNode}-${t.toNode}`;
      const existing = routes.get(key) || { from: t.fromNode, to: t.toNode, count: 0 };
      routes.set(key, { ...existing, count: existing.count + 1 });
    });
    return Array.from(routes.values()).sort((a, b) => b.count - a.count).slice(0, 3);
  };

  const handleStartTrip = () => {
    if (!fromSearch || !toSearch) { alert("Выберите маршрут для начала рейса."); return; }
    setActiveTrip({
      startTime: new Date().toISOString(),
      fromNode: fromSearch,
      toNode: toSearch
    });
  };

  const handleCancelTrip = () => setActiveTrip(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const originNode = nodes.find(n => n.name.toLowerCase() === fromSearch.toLowerCase());
    const destNode = nodes.find(n => n.name.toLowerCase() === toSearch.toLowerCase());

    if (!originNode || !destNode) { alert("Выберите города из списка."); return; }

    const pricePerPack = currencyToCopper(Number(gold) || 0, Number(silver) || 0, Number(copper) || 0);
    if (pricePerPack <= 0) { alert("Укажите цену продажи."); return; }

    setIsSubmitting(true);
    const count = Math.max(1, Number(packsCount) || 1);
    
    let durationMinutes: number | undefined;
    if (activeTrip) {
      const diff = new Date().getTime() - new Date(activeTrip.startTime).getTime();
      durationMinutes = Math.max(1, Math.floor(diff / 60000)); // Minimum 1 min recorded
    }

    const newTrade: TradeRecord = {
      id: crypto.randomUUID(),
      fromNode: originNode.name,
      toNode: destNode.name,
      packsCount: count,
      pricePerPack,
      profit: pricePerPack * count,
      timestamp: new Date().toISOString(),
      type: 'sale',
      durationMinutes
    };

    onAddTrade(newTrade);
    setGold(''); setSilver(''); setCopper(''); setPacksCount('3');
    setFromSearch(''); setToSearch('');
    setActiveTrip(null);
    setTimeout(() => setIsSubmitting(false), 600);
  };

  const favorites = getFavoriteRoutes();

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
        {currentBalance !== undefined && (
          <div className="flex flex-col items-end opacity-60">
            <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Кошелек</span>
            <span className="text-[10px] font-black text-amber-500 flex items-center gap-1">
              <Wallet size={10} /> {formatCurrency(currentBalance)}
            </span>
          </div>
        )}
      </div>

      {/* Favorite Routes */}
      {!activeTrip && favorites.length > 0 && (
        <div className="mb-6 space-y-2">
          <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 flex items-center gap-1">
            <Star size={10} /> Частые маршруты
          </label>
          <div className="flex flex-wrap gap-2">
            {favorites.map((fav, i) => (
              <button 
                key={i} 
                type="button" 
                onClick={() => { setFromSearch(fav.from); setToSearch(fav.to); }}
                className="px-3 py-1.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-[10px] font-bold text-slate-400 hover:bg-amber-500/10 hover:border-amber-500/30 hover:text-amber-500 transition-all truncate max-w-[150px]"
              >
                {fav.from} → {fav.to}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTrip && (
        <div className="mb-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center gap-3">
             <div className="relative">
                <Clock className="text-amber-500 animate-pulse" size={18} />
             </div>
             <div>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Рейс в процессе</p>
                  <span className="text-[10px] font-mono font-black text-white bg-amber-500 px-1.5 py-0.5 rounded leading-none">{elapsedTime}</span>
                </div>
                <p className="text-xs font-bold text-white mt-0.5">{activeTrip.fromNode} → {activeTrip.toNode}</p>
             </div>
          </div>
          <button onClick={handleCancelTrip} className="text-slate-500 hover:text-rose-500 transition-colors p-1"><X size={16} /></button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-5">
          <div className="space-y-2 relative" ref={fromRef}>
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">Откуда</label>
            <div className="relative">
              <input 
                type="text" 
                value={fromSearch} 
                disabled={!!activeTrip}
                onFocus={() => setShowFromSuggestions(true)} 
                onChange={(e) => setFromSearch(e.target.value)} 
                placeholder="Введите название..." 
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-200 font-bold outline-none pl-12 disabled:opacity-50 transition-opacity" 
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
            </div>
            {showFromSuggestions && (
              <div className="absolute z-50 w-full mt-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-200">
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
              <input 
                type="text" 
                value={toSearch} 
                disabled={!!activeTrip}
                onFocus={() => setShowToSuggestions(true)} 
                onChange={(e) => setToSearch(e.target.value)} 
                placeholder="Введите название..." 
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-200 font-bold outline-none pl-12 disabled:opacity-50 transition-opacity" 
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
            </div>
            {showToSuggestions && (
              <div className="absolute z-50 w-full mt-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-200">
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
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Кол-во паков</label>
              <div className="flex gap-1">
                {['1', '2', '3'].map(num => (
                  <button 
                    key={num} 
                    type="button" 
                    onClick={() => setPacksCount(num)}
                    className={`w-6 h-6 rounded-md text-[10px] font-black transition-all ${packsCount === num ? 'bg-amber-500 text-slate-950 scale-110 shadow-lg shadow-amber-500/20' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
            <input type="number" value={packsCount} onChange={(e) => setPacksCount(e.target.value)} min="1" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-black outline-none focus:ring-1 focus:ring-amber-500/30" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Цена за пак</label>
            <div className="grid grid-cols-3 gap-2">
              <div className="relative">
                <input type="number" value={gold} onChange={(e) => setGold(e.target.value)} placeholder="0" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 pr-8 text-white font-black outline-none focus:ring-1 focus:ring-amber-500/30" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500 font-black">G</span>
              </div>
              <div className="relative">
                <input type="number" value={silver} onChange={(e) => setSilver(e.target.value)} placeholder="0" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 pr-8 text-white font-black outline-none focus:ring-1 focus:ring-slate-400/30" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-black">S</span>
              </div>
              <div className="relative">
                <input type="number" value={copper} onChange={(e) => setCopper(e.target.value)} placeholder="0" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 pr-8 text-white font-black outline-none focus:ring-1 focus:ring-orange-600/30" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-700 font-black">C</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          {!activeTrip && (
            <button 
              type="button" 
              onClick={handleStartTrip}
              className="flex-1 py-5 rounded-2xl font-black uppercase tracking-widest text-slate-400 border border-slate-800 hover:border-amber-500/50 hover:text-amber-500 transition-all flex items-center justify-center gap-2"
            >
              <Play size={16} /> Старт рейса
            </button>
          )}
          <button type="submit" disabled={isSubmitting} className="flex-[2] py-5 rounded-2xl font-black uppercase tracking-widest text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:scale-[1.02] active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50">
            {activeTrip ? <Flag size={16} /> : <PlusCircle size={16} />}
            {activeTrip ? 'Завершить рейс' : (isSubmitting ? 'Запись...' : 'Продать')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TradeForm;
