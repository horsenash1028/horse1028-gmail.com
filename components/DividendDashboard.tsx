import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { PlusCircle, DollarSign, Calendar, TrendingUp, History } from 'lucide-react';
import { DividendRecord } from '../types';

interface DividendDashboardProps {
  dividends: DividendRecord[];
  holdingNames: string[];
  onAddDividend: (record: Omit<DividendRecord, 'id'>) => void;
}

export const DividendDashboard: React.FC<DividendDashboardProps> = ({ 
  dividends, 
  holdingNames,
  onAddDividend 
}) => {
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newStock, setNewStock] = useState(holdingNames[0] || '');
  const [newAmount, setNewAmount] = useState('');

  const formatMoney = (val: number) => new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 }).format(val);

  // Statistics
  const stats = useMemo(() => {
    const totalAllTime = dividends.reduce((sum, item) => sum + item.amount, 0);
    const currentYear = new Date().getFullYear();
    const totalThisYear = dividends
      .filter(d => new Date(d.date).getFullYear() === currentYear)
      .reduce((sum, item) => sum + item.amount, 0);
    
    return { totalAllTime, totalThisYear };
  }, [dividends]);

  // Chart Data: Group by Month (Last 12 months or similar logic, simplistic here: Group all by YYYY-MM)
  const chartData = useMemo(() => {
    const map: Record<string, number> = {};
    
    // Sort dividends by date
    const sorted = [...dividends].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sorted.forEach(d => {
      const monthStr = d.date.substring(0, 7); // YYYY-MM
      map[monthStr] = (map[monthStr] || 0) + d.amount;
    });

    return Object.keys(map).map(key => ({
      name: key,
      amount: map[key]
    }));
  }, [dividends]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStock || !newAmount) return;

    onAddDividend({
      date: newDate,
      stockName: newStock,
      amount: parseFloat(newAmount)
    });

    // Reset fields
    setNewAmount('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
          <DollarSign size={24} />
        </div>
        <h2 className="text-xl font-bold text-slate-900">股息儀表板 (Dividend Dashboard)</h2>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-emerald-100 font-medium mb-1">今年領取股息 (YTD)</p>
              <h3 className="text-3xl font-bold">{formatMoney(stats.totalThisYear)}</h3>
            </div>
            <TrendingUp className="text-emerald-200" size={24}/>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
           <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 font-medium mb-1">歷史累計股息 (Total All-time)</p>
              <h3 className="text-3xl font-bold text-slate-800">{formatMoney(stats.totalAllTime)}</h3>
            </div>
            <History className="text-slate-300" size={24}/>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-80">
          <h3 className="text-sm font-bold text-slate-700 mb-4">月度股息分佈 (Monthly Income)</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{fontSize: 12}} stroke="#94a3b8" />
              <YAxis tick={{fontSize: 12}} stroke="#94a3b8" tickFormatter={(val) => `$${val/1000}k`} />
              <Tooltip 
                formatter={(value: number) => formatMoney(value)}
                cursor={{fill: '#f1f5f9'}}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Right: Add Form & Recent List */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Add Form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
              <PlusCircle size={16} className="text-emerald-500"/> 新增紀錄
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">入帳日期</label>
                <div className="relative">
                  <input 
                    type="date" 
                    required
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                  <Calendar className="absolute left-3 top-2.5 text-slate-400" size={16} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">標的名稱</label>
                <select 
                  value={newStock}
                  onChange={e => setNewStock(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                >
                  <option value="" disabled>選擇標的...</option>
                  {holdingNames.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">金額 (TWD)</label>
                <input 
                  type="number" 
                  required
                  placeholder="0"
                  value={newAmount}
                  onChange={e => setNewAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              <button 
                type="submit"
                className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-lg text-sm transition-colors shadow-sm shadow-emerald-200"
              >
                新增紀錄
              </button>
            </form>
          </div>

          {/* Recent History (Mini) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex-1 overflow-hidden flex flex-col">
            <h3 className="text-sm font-bold text-slate-700 mb-3">最近入帳</h3>
            <div className="overflow-y-auto pr-1 flex-1">
              <div className="space-y-3">
                {[...dividends].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5).map(item => (
                  <div key={item.id} className="flex justify-between items-center text-sm p-2 hover:bg-slate-50 rounded-lg transition-colors border-b border-slate-50 last:border-0">
                    <div>
                      <p className="font-medium text-slate-800">{item.stockName}</p>
                      <p className="text-xs text-slate-400">{item.date}</p>
                    </div>
                    <span className="font-bold text-emerald-600">+{formatMoney(item.amount)}</span>
                  </div>
                ))}
                {dividends.length === 0 && <p className="text-xs text-slate-400 text-center py-4">尚無紀錄</p>}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};