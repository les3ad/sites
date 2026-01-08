
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TradeRecord, ExpenseRecord, CoinSaleRecord, NodeInfo } from './types';
import { 
  STORAGE_KEY, 
  EXPENSES_STORAGE_KEY,
  COIN_SALES_STORAGE_KEY,
  NODES_STORAGE_KEY, 
  DEFAULT_NODES, 
  SCHEMA_VERSION_KEY, 
  CURRENT_SCHEMA_VERSION 
} from './constants';
import { formatCurrency, currencyToCopper } from './utils/currency';
import TradeForm from './components/TradeForm';
import PurchaseForm from './components/PurchaseForm';
import CoinSaleForm from './components/CoinSaleForm';
import TradeHistory from './components/TradeHistory';
import Dashboard from './components/Dashboard';
import { getTradingAdvice } from './services/geminiService';
import { 
  Compass, 
  Sparkles, 
  LayoutDashboard, 
  ScrollText, 
  RefreshCw, 
  MapPin, 
  X, 
  Database, 
  Download, 
  Upload, 
  Trash2,
  BrainCircuit,
  Settings,
  ShieldCheck,
  History,
  ShoppingCart,
  CalendarDays,
  Play,
  Wallet,
  DollarSign
} from 'lucide-react';

const App: React.FC = () => {
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [coinSales, setCoinSales] = useState<CoinSaleRecord[]>([]);
  const [nodes, setNodes] = useState<NodeInfo[]>([]);
  const [newNodeName, setNewNodeName] = useState('');
  const [showNodeManager, setShowNodeManager] = useState(false);
  const [showDbSettings, setShowDbSettings] = useState(false);
  const [showStartDayModal, setShowStartDayModal] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'ai-analysis'>('dashboard');
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [dayStartTime, setDayStartTime] = useState<string | null>(null);
  const [startingBalance, setStartingBalance] = useState<number>(0); // in copper
  
  const [startGold, setStartGold] = useState('');
  const [startSilver, setStartSilver] = useState('');
  const [startCopper, setStartCopper] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initStorage = () => {
      const savedTrades = localStorage.getItem(STORAGE_KEY);
      const savedExpenses = localStorage.getItem(EXPENSES_STORAGE_KEY);
      const savedCoinSales = localStorage.getItem(COIN_SALES_STORAGE_KEY);
      const savedNodes = localStorage.getItem(NODES_STORAGE_KEY);
      const savedDayStart = localStorage.getItem('aoc_day_start');
      const savedStartingBalance = localStorage.getItem('aoc_starting_balance');

      if (savedTrades) setTrades(JSON.parse(savedTrades));
      if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
      if (savedCoinSales) setCoinSales(JSON.parse(savedCoinSales));
      if (savedDayStart) setDayStartTime(savedDayStart);
      if (savedStartingBalance) setStartingBalance(Number(savedStartingBalance));
      
      if (savedNodes) {
        const parsed = JSON.parse(savedNodes);
        setNodes([...DEFAULT_NODES, ...parsed.filter((p: any) => !DEFAULT_NODES.some(dn => dn.name === p.name))].sort((a, b) => a.name.localeCompare(b.name)));
      } else {
        setNodes(DEFAULT_NODES);
      }
      setIsDataLoaded(true);
    };
    initStorage();
  }, []);

  useEffect(() => {
    if (isDataLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
      localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
      localStorage.setItem(COIN_SALES_STORAGE_KEY, JSON.stringify(coinSales));
      localStorage.setItem(NODES_STORAGE_KEY, JSON.stringify(nodes.filter(n => !DEFAULT_NODES.some(dn => dn.name === n.name))));
      localStorage.setItem('aoc_starting_balance', startingBalance.toString());
      if (dayStartTime) localStorage.setItem('aoc_day_start', dayStartTime);
      else localStorage.removeItem('aoc_day_start');
    }
  }, [trades, expenses, coinSales, dayStartTime, startingBalance, nodes, isDataLoaded]);

  const handleAddTrade = (newTrade: TradeRecord) => setTrades(prev => [newTrade, ...prev]);
  const handleAddExpense = (newExpense: ExpenseRecord) => setExpenses(prev => [newExpense, ...prev]);
  const handleAddCoinSale = (newSale: CoinSaleRecord) => setCoinSales(prev => [newSale, ...prev]);
  
  const handleDeleteTrade = (id: string) => setTrades(prev => prev.filter(t => t.id !== id));
  const handleDeleteExpense = (id: string) => setExpenses(prev => prev.filter(e => e.id !== id));
  const handleDeleteCoinSale = (id: string) => setCoinSales(prev => prev.filter(s => s.id !== id));

  const confirmStartDay = () => {
    const total = currencyToCopper(Number(startGold) || 0, Number(startSilver) || 0, Number(startCopper) || 0);
    setStartingBalance(total);
    setDayStartTime(new Date().toISOString());
    setShowStartDayModal(false);
  };

  const clearDay = () => {
    if (window.confirm("Очистить сессию?")) {
      setDayStartTime(null);
      setStartingBalance(0);
    }
  };

  // Fix: Implemented missing exportDatabase function
  const exportDatabase = () => {
    const data = {
      trades,
      expenses,
      coinSales,
      nodes: nodes.filter(n => !DEFAULT_NODES.some(dn => dn.name === n.name)),
      version: CURRENT_SCHEMA_VERSION,
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aoc_merchant_log_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const currentTrades = dayStartTime ? trades.filter(t => new Date(t.timestamp) >= new Date(dayStartTime)) : trades;
  const currentExpenses = dayStartTime ? expenses.filter(e => new Date(e.timestamp) >= new Date(dayStartTime)) : expenses;
  const currentCoinSales = dayStartTime ? coinSales.filter(s => new Date(s.timestamp) >= new Date(dayStartTime)) : coinSales;

  const totalShiftProfit = currentTrades.reduce((sum, t) => sum + t.profit, 0);
  const totalShiftExpenses = currentExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalShiftCoinSales = currentCoinSales.reduce((sum, s) => sum + s.amount, 0);
  const currentWalletBalance = startingBalance + totalShiftProfit - totalShiftExpenses - totalShiftCoinSales;

  const fetchAiAdvice = useCallback(async () => {
    setIsAiLoading(true);
    const advice = await getTradingAdvice(currentTrades, currentExpenses, currentCoinSales);
    setAiAdvice(advice);
    setIsAiLoading(false);
  }, [currentTrades, currentExpenses, currentCoinSales]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 pb-40">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-16 border-b border-slate-900 pb-10">
          <div className="flex items-center gap-6">
            <div className="bg-gradient-to-br from-amber-400 to-amber-700 p-5 rounded-[2.5rem] shadow-2xl">
              <Compass className="text-slate-950" size={42} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase tracking-[0.4em] border border-amber-500/20 rounded-full">
                  Trade v2.3
                </span>
                {dayStartTime && (
                  <span className="text-[9px] font-black uppercase text-emerald-500 tracking-widest bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                    Wallet: {formatCurrency(currentWalletBalance)}
                  </span>
                )}
              </div>
              <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic leading-none">
                Merchant <span className="text-amber-500">Log</span>
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
             {dayStartTime ? (
               <button onClick={clearDay} className="flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest bg-rose-500/10 text-rose-500 border border-rose-500/20 transition-all"><X size={16} /> Стоп Смена</button>
             ) : (
               <button onClick={() => setShowStartDayModal(true)} className="flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest bg-emerald-500 text-slate-950 border border-emerald-500 hover:scale-105 transition-all"><Play size={16} /> Начать День</button>
             )}
             <button onClick={() => setShowDbSettings(!showDbSettings)} className="px-6 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 uppercase font-black text-[10px] tracking-widest flex items-center gap-2"><Settings size={14} /> База</button>
          </div>
        </header>

        {showStartDayModal && (
          <div className="fixed inset-0 bg-slate-950/90 z-[100] flex items-center justify-center p-6 backdrop-blur-sm">
            <div className="bg-slate-900 border border-emerald-500/30 p-10 rounded-[3rem] max-w-md w-full shadow-2xl">
              <h3 className="text-2xl font-black text-white uppercase italic mb-6">Стартовый Капитал</h3>
              <div className="grid grid-cols-3 gap-3 mb-8">
                <input type="number" value={startGold} onChange={(e) => setStartGold(e.target.value)} placeholder="G" className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-black outline-none focus:ring-2 focus:ring-amber-500" />
                <input type="number" value={startSilver} onChange={(e) => setStartSilver(e.target.value)} placeholder="S" className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-black outline-none focus:ring-2 focus:ring-slate-400" />
                <input type="number" value={startCopper} onChange={(e) => setStartCopper(e.target.value)} placeholder="C" className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-black outline-none focus:ring-2 focus:ring-orange-600" />
              </div>
              <button onClick={confirmStartDay} className="w-full py-4 bg-emerald-500 text-slate-950 rounded-2xl font-black uppercase tracking-widest shadow-xl">Начать смену</button>
            </div>
          </div>
        )}

        {showDbSettings && (
          <div className="mb-10 p-8 bg-slate-900 border border-slate-800 rounded-[3rem] animate-in zoom-in-95 duration-300">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black uppercase tracking-widest text-white">Управление БД</h3>
                <button onClick={() => setShowDbSettings(false)} className="text-slate-500 hover:text-white"><X /></button>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <button onClick={exportDatabase} className="p-6 bg-slate-800 border border-slate-700 rounded-2xl uppercase font-black text-xs tracking-widest flex items-center justify-center gap-2"><Download size={18} /> Экспорт</button>
                <button onClick={() => { if(confirm('Очистить всё?')) { setTrades([]); setExpenses([]); setCoinSales([]); } }} className="p-6 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl uppercase font-black text-xs tracking-widest flex items-center justify-center gap-2"><Trash2 size={18} /> Сброс</button>
             </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-4 space-y-10">
             <TradeForm nodes={nodes} onAddTrade={handleAddTrade} currentBalance={currentWalletBalance} />
             <PurchaseForm onAddExpense={handleAddExpense} currentBalance={currentWalletBalance} />
             <CoinSaleForm onAddCoinSale={handleAddCoinSale} currentBalance={currentWalletBalance} />
          </div>

          <div className="lg:col-span-8 space-y-10">
            <nav className="flex bg-slate-900/60 p-2 rounded-2xl border border-slate-800 w-fit">
              {['dashboard', 'history', 'ai-analysis'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab as any)} 
                  className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-slate-800 text-amber-500 shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {tab === 'dashboard' ? 'Аналитика' : tab === 'history' ? 'Журнал' : 'Совет ИИ'}
                </button>
              ))}
            </nav>

            <main>
              {activeTab === 'dashboard' && <Dashboard trades={currentTrades} expenses={currentExpenses} coinSales={currentCoinSales} />}
              {activeTab === 'history' && (
                <TradeHistory 
                  trades={trades} 
                  expenses={expenses} 
                  coinSales={coinSales}
                  onDeleteTrade={handleDeleteTrade} 
                  onDeleteExpense={handleDeleteExpense} 
                  onDeleteCoinSale={handleDeleteCoinSale}
                />
              )}
              {activeTab === 'ai-analysis' && (
                <div className="bg-slate-900/40 border border-indigo-500/20 p-10 rounded-[3rem]">
                  <div className="flex justify-between items-center mb-10">
                    <h2 className="text-3xl font-black uppercase italic text-white">Совет <span className="text-indigo-400">Гильдии</span></h2>
                    <button onClick={fetchAiAdvice} disabled={isAiLoading} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2">
                      {isAiLoading ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />} Пересчитать
                    </button>
                  </div>
                  <div className="prose prose-invert max-w-none text-slate-300 bg-slate-950/50 p-8 rounded-3xl min-h-[300px]">
                    {aiAdvice || "Нет данных для генерации отчета. Начните торговлю!"}
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>

        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-10 bg-slate-900/95 border border-slate-800 px-12 py-5 rounded-[2.5rem] shadow-2xl backdrop-blur-2xl z-50">
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-500 uppercase font-black mb-1">В кошельке (расчет)</span>
            <span className="text-2xl font-black text-emerald-400">{formatCurrency(currentWalletBalance)}</span>
          </div>
          <div className="h-12 w-[1px] bg-slate-800"></div>
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-500 uppercase font-black mb-1">Вывод в USD</span>
            <span className="text-2xl font-black text-emerald-400 flex items-center gap-1">
              <DollarSign size={20} />
              {currentCoinSales.reduce((sum, s) => sum + s.usdPrice, 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
