
import React, { useState, useEffect, useCallback } from 'react';
import { TradeRecord } from './types';
import { STORAGE_KEY } from './constants';
import { formatCurrency } from './utils/currency';
import TradeForm from './components/TradeForm';
import TradeHistory from './components/TradeHistory';
import Dashboard from './components/Dashboard';
import { getTradingAdvice } from './services/geminiService';
import { Compass, Sparkles, LayoutDashboard, ScrollText, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history'>('dashboard');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setTrades(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse stored trades");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
  }, [trades]);

  const handleAddTrade = (newTrade: TradeRecord) => {
    setTrades(prev => [newTrade, ...prev]);
  };

  const handleDeleteTrade = (id: string) => {
    setTrades(prev => prev.filter(t => t.id !== id));
  };

  const fetchAiAdvice = useCallback(async () => {
    if (trades.length === 0) return;
    setIsAiLoading(true);
    const advice = await getTradingAdvice(trades);
    setAiAdvice(advice);
    setIsAiLoading(false);
  }, [trades]);

  useEffect(() => {
    if (trades.length > 0 && !aiAdvice) {
      fetchAiAdvice();
    }
  }, [trades.length, aiAdvice, fetchAiAdvice]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500/10 p-3 rounded-2xl border border-amber-500/30">
            <Compass className="text-amber-500" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">
              Ashes <span className="text-amber-500">Контроль</span> Торговли
            </h1>
            <p className="text-slate-400 text-sm">Логистика караванов и анализ прибыли</p>
          </div>
        </div>

        <button
          onClick={fetchAiAdvice}
          disabled={isAiLoading || trades.length === 0}
          className="flex items-center gap-2 bg-slate-900 border border-slate-700 hover:border-amber-500/50 px-4 py-2 rounded-xl text-sm transition-all text-slate-300 hover:text-white group"
        >
          {isAiLoading ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : (
            <Sparkles size={16} className="text-amber-400 group-hover:scale-125 transition-transform" />
          )}
          Советы от ИИ
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <TradeForm onAddTrade={handleAddTrade} />

          <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900/50 border border-indigo-500/20 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <Sparkles size={64} className="text-amber-400" />
            </div>
            <h3 className="text-amber-400 font-bold mb-3 flex items-center gap-2 uppercase tracking-wider text-xs">
              <Sparkles size={14} /> Аналитика рынка (ИИ)
            </h3>
            <div className="text-slate-300 text-sm leading-relaxed min-h-[80px]">
              {isAiLoading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-800 rounded w-1/2"></div>
                </div>
              ) : (
                aiAdvice || "Записывайте сделки, чтобы ИИ проанализировал ваши маршруты."
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 w-fit">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'dashboard' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <LayoutDashboard size={16} /> Статистика
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'history' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <ScrollText size={16} /> История
            </button>
          </div>

          {activeTab === 'dashboard' ? (
            <Dashboard trades={trades} />
          ) : (
            <TradeHistory trades={trades} onDelete={handleDeleteTrade} />
          )}
        </div>
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-xl border border-slate-800 px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 z-50">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Итог сессии</span>
          <span className="text-lg font-black text-amber-400">
            {formatCurrency(trades.reduce((sum, t) => sum + t.profit, 0))}
          </span>
        </div>
        <div className="h-8 w-[1px] bg-slate-800"></div>
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Статус</span>
          <span className="text-sm font-bold text-emerald-400 flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Отслеживание
          </span>
        </div>
      </div>
    </div>
  );
};

export default App;
