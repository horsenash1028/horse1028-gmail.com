import React from 'react';
import { Holding, AssetType } from '../types';

interface HoldingsTableProps {
  holdings: Holding[];
  onUpdate: (index: number, field: 'currentPrice' | 'currentValue' | 'cost', value: number) => void;
}

export const HoldingsTable: React.FC<HoldingsTableProps> = ({ holdings, onUpdate }) => {
  const formatMoney = (val: number) => new Intl.NumberFormat('zh-TW').format(val);
  
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-10">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800">持股明細 (Holdings)</h3>
        <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">
          * 可編輯欄位：持有現值、持有成本
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-medium">
            <tr>
              <th className="px-6 py-4">名稱</th>
              <th className="px-6 py-4">類型</th>
              <th className="px-6 py-4 text-right">現價</th>
              <th className="px-6 py-4 text-right">持有現值</th>
              <th className="px-6 py-4 text-right">持有成本</th>
              <th className="px-6 py-4 text-right">總損益</th>
              <th className="px-6 py-4 text-right">報酬率</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {holdings.map((item, index) => (
              <tr key={item.name} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4 font-medium text-slate-900">{item.name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    item.type === AssetType.Stock 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'bg-amber-50 text-amber-600'
                  }`}>
                    {item.type === AssetType.Stock ? '股票' : '債券'}
                  </span>
                </td>
                
                {/* Read-only Current Price */}
                <td className="px-6 py-4 text-right text-slate-600">
                  {item.currentPrice.toFixed(2)}
                </td>

                {/* Editable Current Value */}
                <td className="px-6 py-4 text-right">
                  <input 
                    type="number"
                    value={item.currentValue}
                    onChange={(e) => onUpdate(index, 'currentValue', parseFloat(e.target.value) || 0)}
                    className="w-28 text-right px-2 py-1 border border-slate-200 rounded font-medium text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all bg-white hover:border-slate-300"
                  />
                </td>

                {/* Editable Cost */}
                <td className="px-6 py-4 text-right">
                  <input 
                    type="number"
                    value={item.cost}
                    onChange={(e) => onUpdate(index, 'cost', parseFloat(e.target.value) || 0)}
                    className="w-28 text-right px-2 py-1 border border-slate-200 rounded text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all bg-white hover:border-slate-300"
                  />
                </td>

                <td className={`px-6 py-4 text-right font-bold ${item.totalProfitLoss >= 0 ? 'text-tw-up' : 'text-tw-down'}`}>
                  {item.totalProfitLoss >= 0 ? '+' : ''}{formatMoney(item.totalProfitLoss)}
                </td>
                <td className={`px-6 py-4 text-right font-bold ${item.returnRate >= 0 ? 'text-tw-up' : 'text-tw-down'}`}>
                  {item.returnRate.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};