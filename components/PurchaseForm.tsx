
import React, { useState } from 'react';
import { ExpenseRecord } from '../types';
import { currencyToCopper, formatCurrency } from '../utils/currency';
import { ShoppingCart, Coins, PlusCircle, PenTool, Wallet, ArrowDown } from 'lucide-react';

interface PurchaseFormProps {
  onAddExpense: (expense: ExpenseRecord) => void;
  currentBalance: number;
}

const PurchaseForm: React.FC<PurchaseFormProps> = ({ onAddExpense, currentBalance }) => {
  const [label, setLabel] = useState('');
  const [remGold, setRemGold] = useState<string>('');
  const [remSilver, setRemSilver] = useState<string>('');
  const [remCopper, setRemCopper] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const remTotal = currencyToCopper(Number(remGold) || 0, Number(remSilver) || 0, Number(remCopper) || 0);
    
    // Calculate the difference
    const amountSpent = currentBalance - remTotal;

    if (amountSpent <= 0) {
      alert("Введенный остаток больше или равен текущему балансу. Расход должен быть положительным.");
      return;
    }

    setIsSubmitting(true);
    const newExpense: ExpenseRecord = {
      id: crypto.randomUUID(),
      label: label.trim() || 'Закупка ресурсов',
      amount: amountSpent,
      timestamp: new Date().toISOString(),
      type: 'expense',
    };

    onAddExpense(newExpense);
    setRemGold(''); setRemSilver(''); setRemCopper(''); setLabel('');
    setTimeout(() => setIsSubmitting(false), 600);
  };

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500/0 via-rose-500 to-rose-500/0 opacity-50"></div>
      
      <div className="flex justify-between items-start mb-8">
        <h2 className="text-2xl font-black flex items-center gap-3 text-white uppercase italic tracking-tighter">
          <div className="p-2 bg-rose-500/10 rounded-xl">
            <ShoppingCart className="text-rose-500" size={24} />
          </div>
          Траты
        </h2>
        <div className="flex flex-col items-end opacity-60 text-right">
          <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Баланс ДО</span>
          <span className="text-[10px] font-black text-emerald-400 flex items-center gap-1">
            <Wallet size={10} /> {formatCurrency(currentBalance)}
          </span>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
            Что купили?
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Напр: Железо, Уголь..."
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-200 font-bold outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
            <ArrowDown size={12} className="text-rose-500" /> Остаток в кошельке ПОСЛЕ ТРАТЫ
          </label>
          <div className="grid grid-cols-3 gap-2">
            <div className="relative">
              <input type="number" value={remGold} onChange={(e) => setRemGold(e.target.value)} placeholder="0" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 pr-8 text-white font-black outline-none" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500 font-black">G</span>
            </div>
            <div className="relative">
              <input type="number" value={remSilver} onChange={(e) => setRemSilver(e.target.value)} placeholder="0" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 pr-8 text-white font-black outline-none" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-black">S</span>
            </div>
            <div className="relative">
              <input type="number" value={remCopper} onChange={(e) => setRemCopper(e.target.value)} placeholder="0" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 pr-8 text-white font-black outline-none" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-700 font-black">C</span>
            </div>
          </div>
          {remGold || remSilver || remCopper ? (
            <p className="text-[10px] text-rose-500 font-bold mt-2">
              Расход составит: {formatCurrency(currentBalance - currencyToCopper(Number(remGold), Number(remSilver), Number(remCopper)))}
            </p>
          ) : null}
        </div>

        <button type="submit" disabled={isSubmitting || currentBalance === 0} className="w-full py-5 rounded-2xl font-black uppercase tracking-widest text-slate-950 bg-gradient-to-r from-rose-500 to-rose-600 hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-50">
          {currentBalance === 0 ? 'Начните день!' : (isSubmitting ? 'Запись...' : 'Внести остаток')}
        </button>
      </form>
    </div>
  );
};

export default PurchaseForm;
