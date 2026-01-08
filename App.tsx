
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TradeRecord, ExpenseRecord, CoinSaleRecord, NodeInfo, ChatMessage } from './types';
import { 
  STORAGE_KEY, 
  EXPENSES_STORAGE_KEY, 
  COIN_SALES_STORAGE_KEY, 
  NODES_STORAGE_KEY, 
  DEFAULT_NODES, 
  CURRENT_SCHEMA_VERSION 
} from './constants';
import { formatCurrency, currencyToCopper } from './utils/currency';
import TradeForm from './components/TradeForm';
import PurchaseForm from './components/PurchaseForm';
import CoinSaleForm from './components/CoinSaleForm';
import TradeHistory from './components/TradeHistory';
import Dashboard from './components/Dashboard';
import { getTradingAdvice, startOracleChat } from './services/geminiService';
import { 
  Compass, 
  Sparkles, 
  LayoutDashboard, 
  ScrollText, 
  RefreshCw, 
  X, 
  Database, 
  Download, 
  Upload, 
  Trash2,
  BrainCircuit,
  Settings,
  Play,
  DollarSign,
  Send,
  User,
  Bot,
  TrendingUp,
  Map
} from 'lucide-react';

const App: React.FC = () => {
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [coinSales, setCoinSales] = useState<CoinSaleRecord[]>([]);
  const [nodes, setNodes] = useState<NodeInfo[]>([]);
  const [showDbSettings, setShowDbSettings] = useState(false);
  const [showStartDayModal, setShowStartDayModal] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'ai-analysis'>('dashboard');
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatSessionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Shift state
  const [dayStartTime, setDayStartTime] = useState<string | null>(null);
  const [startingBalance, setStartingBalance] = useState<number>(0); 

  // Modal input fields
  const [startGold, setStartGold] = useState('');
  const [startSilver, setStartSilver] = useState('');
  const [startCopper, setStartCopper] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initStorage = () => {
      try {
        const savedTrades = localStorage.getItem(STORAGE_KEY);
        const savedExpenses = localStorage.getItem(EXPENSES_STORAGE_KEY);
        const savedCoinSales = localStorage.getItem(COIN_SALES_STORAGE_KEY);
        const savedNodes = localStorage.getItem(NODES_STORAGE_KEY);
        const savedDayStart = localStorage.getItem('aoc_day_start');
        const savedStartingBalance = localStorage.getItem('aoc_starting_balance');

        if (savedTrades) setTrades(JSON.parse(savedTrades));
        if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
        if (savedCoinSales) setCoinSales(JSON.parse(savedCoinSales));
        
        if (savedDayStart && savedDayStart !== 'null') setDayStartTime(savedDayStart);
        if (savedStartingBalance) setStartingBalance(Number(savedStartingBalance));
        
        if (savedNodes) {
          const parsed = JSON.parse(savedNodes);
          setNodes([...DEFAULT_NODES, ...parsed.filter((p: any) => !DEFAULT_NODES.some(dn => dn.name === p.name))].sort((a, b) => a.name.localeCompare(b.name)));
        } else {
          setNodes(DEFAULT_NODES);
        }
      } catch (e) {
        console.error("Storage error", e);
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
      
      if (dayStartTime) {
        localStorage.setItem('aoc_day_start', dayStartTime);
        localStorage.setItem('aoc_starting_balance', startingBalance.toString());
      } else {
        localStorage.removeItem('aoc_day_start');
        localStorage.removeItem('aoc_starting_balance');
      }
    }
  }, [trades, expenses, coinSales, dayStartTime, startingBalance, nodes, isDataLoaded]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleAddTrade = (newTrade: TradeRecord) => setTrades(prev => [newTrade, ...prev]);
  const handleAddExpense = (newExpense: ExpenseRecord) => setExpenses(prev => [newExpense, ...prev]);
  const handleAddCoinSale = (newSale: CoinSaleRecord) => setCoinSales(prev => [newSale, ...prev]);
  
  const handleDeleteTrade = (id: string) => setTrades(prev => prev.filter(t => t.id !== id));
  const handleDeleteExpense = (id: string) => setExpenses(prev => prev.filter(e => e.id !== id));
  const handleDeleteCoinSale = (id: string) => setCoinSales(prev => prev.filter(s => s.id !== id));

  const handleUpdateTrade = (updated: TradeRecord) => setTrades(prev => prev.map(t => t.id === updated.id ? updated : t));
  const handleUpdateExpense = (updated: ExpenseRecord) => setExpenses(prev => prev.map(e => e.id === updated.id ? updated : e));
  const handleUpdateCoinSale = (updated: CoinSaleRecord) => setCoinSales(prev => prev.map(s => s.id === updated.id ? updated : s));

  const confirmStartDay = () => {
    const total = currencyToCopper(Number(startGold) || 0, Number(startSilver) || 0, Number(startCopper) || 0);
    setStartingBalance(total);
    const now = new Date().toISOString();
    setDayStartTime(now);
    setShowStartDayModal(false);
    setStartGold(''); setStartSilver(''); setStartCopper('');
  };

  const stopShift = () => {
    if (window.confirm("Завершить текущую смену?")) {
      setDayStartTime(null);
      setStartingBalance(0);
      localStorage.removeItem('aoc_day_start');
      localStorage.removeItem('aoc_starting_balance');
    }
  };

  const exportDatabase = () => {
    const data = {
      trades,
      expenses,
      coinSales,
      nodes: nodes.filter(n => !DEFAULT_NODES.some(dn => dn.name === n.name)),
      dayStartTime,
      startingBalance,
      version: CURRENT_SCHEMA_VERSION,
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `verra_merchant_db_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.trades) setTrades(data.trades);
        if (data.expenses) setExpenses(data.expenses);
        if (data.coinSales) setCoinSales(data.coinSales);
        if (data.nodes) setNodes([...DEFAULT_NODES, ...data.nodes]);
        
        if (data.dayStartTime) {
          setDayStartTime(data.dayStartTime);
          if (data.startingBalance !== undefined) setStartingBalance(data.startingBalance);
          alert('База данных импортирована. Обнаружена незакрытая смена — вы можете продолжить работу.');
        } else {
          alert('База импортирована успешно.');
        }
        setShowDbSettings(false);
      } catch (err) {
        alert('Ошибка при чтении файла.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: chatInput, timestamp: new Date().toISOString() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      if (!chatSessionRef.current) {
        chatSessionRef.current = startOracleChat(trades, expenses, coinSales);
      }
      const result = await chatSessionRef.current.sendMessage(chatInput);
      const modelMsg: ChatMessage = { role: 'model', text: result.text, timestamp: new Date().toISOString() };
      setChatMessages(prev => [...prev, modelMsg]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'model', text: "Оракул потерял связь с Веррой. Проверьте магический ключ (API Key).", timestamp: new Date().toISOString() }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const fetchAiAdvice = useCallback(async () => {
    setIsAiLoading(true);
    const advice = await getTradingAdvice(trades, expenses, coinSales);
    setAiAdvice(advice);
    setIsAiLoading(false);
  }, [trades, expenses, coinSales]);

  const renderAiContent = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      if (line.startsWith('###')) return <h3 key={i} className="text-xl font-black text-amber-400 mt-6 mb-3 uppercase border-l-4 border-amber-500 pl-3">{line.replace(/#/g, '').trim()}</h3>;
      if (line.startsWith('##')) return <h2 key={i} className="text-2xl font-black text-indigo-400 mt-8 mb-4 border-b border-indigo-500/30 pb-2">{line.replace(/#/g, '').trim()}</h2>;
      if (line.startsWith('-')) return <li key={i} className="ml-5 mb-1 list-disc text-slate-300 text-sm">{line.replace('-', '').trim()}</li>;
      const parts = line.split('**');
      return (
        <p key={i} className="mb-3 text-slate-300 leading-relaxed text-sm">
          {parts.map((part, j) => (j % 2 === 1 ? <strong key={j} className="text-amber-500">{part}</strong> : part))}
        </p>
      );
    });
  };

  const currentTrades = dayStartTime ? trades.filter(t => new Date(t.timestamp) >= new Date(dayStartTime)) : trades;
  const currentExpenses = dayStartTime ? expenses.filter(e => new Date(e.timestamp) >= new Date(dayStartTime)) : expenses;
  const currentCoinSales = dayStartTime ? coinSales.filter(s => new Date(s.timestamp) >= new Date(dayStartTime)) : coinSales;

  const totalShiftProfit = currentTrades.reduce((sum, t) => sum + t.profit, 0);
  const totalShiftExpenses = currentExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalShiftCoinSales = currentCoinSales.reduce((sum, s) => sum + s.amount, 0);
  const currentWalletBalance = startingBalance + totalShiftProfit - totalShiftExpenses - totalShiftCoinSales;

  const usdTotal = coinSales.reduce((sum, s) => sum + s.usdPrice, 0);
  const plnTotal = usdTotal * 4.10;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-16 border-b border-slate-900 pb-10">
          <div className="flex items-center gap-6">
            <div className="bg-gradient-to-br from-amber-400 to-amber-700 p-5 rounded-[2.5rem] shadow-2xl relative group cursor-pointer" onClick={() => setActiveTab('dashboard')}>
              <div className="absolute inset-0 bg-amber-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Compass className="text-slate-950 relative z-10" size={42} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase tracking-[0.4em] border border-amber-500/20 rounded-full">
                  VERRA MERCHANT 🇵🇱 PLN
                </span>
                {dayStartTime && (
                  <span className="text-[9px] font-black uppercase text-emerald-400 tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    СМЕНА: {formatCurrency(currentWalletBalance)}
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
               <button onClick={stopShift} className="flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all shadow-lg hover:shadow-rose-500/20">
                 <X size={16} /> Стоп Смена
               </button>
             ) : (
               <button onClick={() => setShowStartDayModal(true)} className="flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest bg-emerald-500 text-slate-950 border border-emerald-500 hover:scale-105 transition-all shadow-lg shadow-emerald-500/20">
                 <Play size={16} /> Начать Смену
               </button>
             )}
             <button onClick={() => setShowDbSettings(!showDbSettings)} className={`px-6 py-3 rounded-2xl border transition-all uppercase font-black text-[10px] tracking-widest flex items-center gap-2 ${showDbSettings ? 'bg-slate-800 border-slate-600 text-white shadow-xl' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
               <Settings size={14} /> База
             </button>
          </div>
        </header>

        {showDbSettings && (
          <div className="mb-10 p-8 bg-slate-900 border border-slate-800 rounded-[3rem] animate-in slide-in-from-top-4 duration-300 shadow-2xl relative overflow-hidden">
             <div className="flex justify-between items-center mb-10">
                <h3 className="text-xl font-black uppercase tracking-widest text-white flex items-center gap-3">
                  <Database className="text-amber-500" /> Управление Базой
                </h3>
                <button onClick={() => setShowDbSettings(false)} className="text-slate-500 hover:text-white bg-slate-800 p-2 rounded-xl transition-colors"><X /></button>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <button onClick={exportDatabase} className="p-8 bg-slate-800/50 border border-slate-700 rounded-[2rem] uppercase font-black text-[10px] tracking-widest flex flex-col items-center gap-5 hover:border-amber-500/50 hover:bg-slate-800 transition-all group">
                  <Download size={32} className="text-amber-500" /> 
                  Экспорт (JSON)
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="p-8 bg-slate-800/50 border border-slate-700 rounded-[2rem] uppercase font-black text-[10px] tracking-widest flex flex-col items-center gap-5 hover:border-emerald-500/50 hover:bg-slate-800 transition-all group">
                  <Upload size={32} className="text-emerald-500" /> 
                  Импорт Базы
                  <input type="file" ref={fileInputRef} onChange={importDatabase} className="hidden" accept=".json" />
                </button>
                <button onClick={() => { if(confirm('Удалить всю историю?')) { localStorage.clear(); window.location.reload(); } }} className="p-8 bg-rose-500/5 border border-rose-500/20 text-rose-500 rounded-[2rem] uppercase font-black text-[10px] tracking-widest flex flex-col items-center gap-5 hover:bg-rose-500 hover:text-white transition-all group">
                  <Trash2 size={32} /> 
                  Сброс системы
                </button>
             </div>
          </div>
        )}

        {showStartDayModal && (
          <div className="fixed inset-0 bg-slate-950/95 z-[100] flex items-center justify-center p-6 backdrop-blur-lg animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-emerald-500/30 p-10 rounded-[3rem] max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
              <h3 className="text-3xl font-black text-white uppercase italic mb-3 tracking-tighter">Вход в сессию</h3>
              <p className="text-slate-500 text-sm mb-10 leading-relaxed">Введите текущий баланс монет в кошельке для начала отслеживания смены.</p>
              <div className="grid grid-cols-3 gap-4 mb-10">
                <div className="relative group">
                  <input type="number" value={startGold} onChange={(e) => setStartGold(e.target.value)} placeholder="0" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-black outline-none focus:ring-2 focus:ring-amber-500 transition-all" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500 font-black text-[10px]">GOLD</span>
                </div>
                <div className="relative group">
                  <input type="number" value={startSilver} onChange={(e) => setStartSilver(e.target.value)} placeholder="0" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-black outline-none focus:ring-2 focus:ring-slate-400 transition-all" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-black text-[10px]">SILV</span>
                </div>
                <div className="relative group">
                  <input type="number" value={startCopper} onChange={(e) => setStartCopper(e.target.value)} placeholder="0" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-black outline-none focus:ring-2 focus:ring-orange-600 transition-all" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-700 font-black text-[10px]">COPP</span>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setShowStartDayModal(false)} className="flex-1 py-5 bg-slate-800 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:text-white transition-colors">Отмена</button>
                <button onClick={confirmStartDay} className="flex-2 py-5 bg-emerald-500 text-slate-950 rounded-2xl font-black uppercase tracking-widest text-[10px] px-12 shadow-xl shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all">Открыть смену</button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-4 space-y-8">
             <TradeForm nodes={nodes} trades={trades} onAddTrade={handleAddTrade} currentBalance={currentWalletBalance} />
             <PurchaseForm onAddExpense={handleAddExpense} currentBalance={currentWalletBalance} />
             <CoinSaleForm onAddCoinSale={handleAddCoinSale} currentBalance={currentWalletBalance} />
          </div>

          <div className="lg:col-span-8 space-y-10">
            <nav className="flex bg-slate-900/40 p-2 rounded-2xl border border-slate-800/50 w-fit backdrop-blur-xl sticky top-6 z-40">
              <button onClick={() => setActiveTab('dashboard')} className={`px-10 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'dashboard' ? 'bg-slate-800 text-amber-500 shadow-xl shadow-black/50' : 'text-slate-500 hover:text-slate-300'}`}>
                <LayoutDashboard size={14} /> Дашборд
              </button>
              <button onClick={() => setActiveTab('history')} className={`px-10 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'history' ? 'bg-slate-800 text-amber-500 shadow-xl shadow-black/50' : 'text-slate-500 hover:text-slate-300'}`}>
                <ScrollText size={14} /> Журнал
              </button>
              <button onClick={() => setActiveTab('ai-analysis')} className={`px-10 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'ai-analysis' ? 'bg-indigo-600/10 text-indigo-400 shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}>
                <BrainCircuit size={14} /> Оракул 🇵🇱
              </button>
            </nav>

            <main className="min-h-[750px]">
              {activeTab === 'dashboard' && <Dashboard trades={currentTrades} expenses={currentExpenses} coinSales={currentCoinSales} />}
              {activeTab === 'history' && (
                <TradeHistory 
                  trades={trades} 
                  expenses={expenses} 
                  coinSales={coinSales}
                  onDeleteTrade={handleDeleteTrade} 
                  onDeleteExpense={handleDeleteExpense} 
                  onDeleteCoinSale={handleDeleteCoinSale}
                  onUpdateTrade={handleUpdateTrade}
                  onUpdateExpense={handleUpdateExpense}
                  onUpdateCoinSale={handleUpdateCoinSale}
                />
              )}
              {activeTab === 'ai-analysis' && (
                <div className="space-y-10">
                  <div className="bg-slate-900/40 border border-indigo-500/20 p-10 rounded-[4rem] shadow-2xl relative overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
                      <div>
                        <h2 className="text-4xl font-black uppercase italic text-white mb-2 tracking-tighter">Свитки <span className="text-indigo-400 underline decoration-indigo-500/30 underline-offset-8">Оракула</span></h2>
                        <p className="text-slate-500 text-sm">Глубокий аудит экономики и логистики (PLN/G/Time).</p>
                      </div>
                      <button onClick={fetchAiAdvice} disabled={isAiLoading} className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-4 shadow-xl shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all">
                        {isAiLoading ? <RefreshCw className="animate-spin" size={20} /> : <Sparkles size={20} />} 
                        {aiAdvice ? 'ОБНОВИТЬ ОТЧЕТ' : 'ЗАПРОСИТЬ ОТЧЕТ'}
                      </button>
                    </div>
                    
                    <div className="bg-slate-950/80 p-10 rounded-[3rem] border border-slate-800/80 min-h-[400px]">
                      {isAiLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 text-indigo-500 gap-6">
                          <RefreshCw className="animate-spin" size={48} strokeWidth={1} />
                          <span className="text-xs font-black uppercase tracking-[0.4em] text-indigo-300">Оракул медитирует...</span>
                        </div>
                      ) : (
                        <div className="max-w-none">
                          {aiAdvice ? renderAiContent(aiAdvice) : <p className="text-slate-600 text-center italic py-20">Нажмите кнопку выше для анализа ваших сделок в PLN и золоте с учетом лимита в 3 пака.</p>}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Секция живого чата */}
                  <div className="bg-slate-900/40 border border-amber-500/20 p-10 rounded-[4rem] shadow-2xl relative overflow-hidden h-[600px] flex flex-col backdrop-blur-md">
                    <div className="flex items-center gap-4 mb-8">
                       <div className="p-3 bg-amber-500/10 rounded-2xl">
                          <BrainCircuit className="text-amber-500" size={24} />
                       </div>
                       <div>
                          <h3 className="text-xl font-black uppercase italic text-white leading-none tracking-tighter">Диалог с Оракулом</h3>
                          <span className="text-[10px] text-amber-500/60 font-black tracking-widest uppercase">Живой анализ стратегии в реальном времени</span>
                       </div>
                    </div>

                    <div className="flex-1 overflow-y-auto mb-6 pr-4 space-y-6 scrollbar-hide">
                       {chatMessages.length === 0 && (
                          <div className="flex flex-col items-center justify-center h-full text-center px-10">
                             <Bot size={48} className="text-slate-800 mb-4" />
                             <p className="text-slate-500 text-sm italic">Задайте вопрос Оракулу. Он помнит ваши последние сделки и знает лимит в 3 пака. Спросите его об эффективности затраченного времени или о заработке в злотых.</p>
                          </div>
                       )}
                       {chatMessages.map((msg, i) => (
                          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                             <div className={`max-w-[85%] p-5 rounded-3xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-amber-500 text-slate-950 font-bold rounded-tr-none' : 'bg-slate-800/80 text-slate-200 border border-slate-700 rounded-tl-none shadow-xl'}`}>
                                <div className="flex items-center gap-2 mb-2 opacity-50 text-[10px] uppercase font-black">
                                   {msg.role === 'user' ? <User size={10} /> : <Bot size={10} />}
                                   {msg.role === 'user' ? 'Вы' : 'Оракул Верры'}
                                </div>
                                {renderAiContent(msg.text)}
                             </div>
                          </div>
                       ))}
                       {isChatLoading && (
                          <div className="flex justify-start">
                             <div className="bg-slate-800/40 p-5 rounded-3xl rounded-tl-none border border-slate-700/50 flex gap-2">
                                <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce delay-75"></div>
                                <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce delay-150"></div>
                             </div>
                          </div>
                       )}
                       <div ref={chatEndRef} />
                    </div>

                    <form onSubmit={handleSendMessage} className="relative group">
                       <input 
                          type="text" 
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Спроси Оракула о прибыли или маршрутах..." 
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-5 pl-8 pr-20 text-white font-bold outline-none focus:ring-2 focus:ring-amber-500/50 transition-all placeholder:text-slate-700"
                       />
                       <button 
                          type="submit" 
                          disabled={isChatLoading || !chatInput.trim()}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-amber-500 text-slate-950 rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-amber-500/20"
                       >
                          <Send size={20} />
                       </button>
                    </form>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>

        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-20 bg-slate-900/95 border border-slate-800 px-20 py-8 rounded-[4rem] shadow-[0_35px_80px_-20px_rgba(0,0,0,1)] backdrop-blur-3xl z-50 border-b-4 border-b-amber-500/30 animate-in slide-in-from-bottom-12 duration-700">
          <div className="flex flex-col items-start group">
            <span className="text-[10px] text-slate-500 uppercase font-black mb-2 tracking-[0.2em]">{dayStartTime ? 'В КОШЕЛЬКЕ (LIVE)' : 'ОБОРОТ СИСТЕМЫ'}</span>
            <span className={`text-4xl font-black tracking-tighter tabular-nums ${dayStartTime ? 'text-emerald-400' : 'text-amber-500'}`}>{formatCurrency(currentWalletBalance)}</span>
          </div>
          <div className="h-16 w-px bg-slate-800 opacity-40"></div>
          <div className="flex flex-col items-start">
            <span className="text-[10px] text-slate-500 uppercase font-black mb-2 tracking-[0.2em]">ИТОГО В ПОЛЬШЕ (PLN)</span>
            <span className="text-4xl font-black text-emerald-500 flex items-center gap-4 tracking-tighter tabular-nums">
              <span className="text-emerald-600 text-2xl font-black">zł</span>
              {plnTotal.toFixed(2)}
            </span>
          </div>
          {dayStartTime && (
            <div className="absolute -top-5 right-12 bg-amber-500 text-slate-950 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-amber-500/40 border-2 border-slate-900 flex items-center gap-2">
               <span className="w-2 h-2 bg-slate-950 rounded-full animate-pulse"></span>
               Смена активна
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
