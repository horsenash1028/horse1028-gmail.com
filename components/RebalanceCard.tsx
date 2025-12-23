import React from 'react';
import { ArrowRight, Wallet, TrendingUp, TrendingDown } from 'lucide-react';

interface RebalanceCardProps {
  currentStock: number;
  currentBond: number;
  currentCash: number;
  targetInvested: number;
  targetStockRatio: number;
  targetBondRatio: number;
  availableCash: number;
}

export const RebalanceCard: React.FC<RebalanceCardProps> = ({
  currentStock,
  currentBond,
  targetInvested,
  targetStockRatio,
  targetBondRatio,
  availableCash
}) => {
  // Goals
  const goalStock = targetInvested * targetStockRatio; // 4.2M
  const goalBond = targetInvested * targetBondRatio;   // 2.8M
  
  // Gaps (Positive means Buy, Negative means Sell - though we usually just buy with cash)
  const stockGap = goalStock - currentStock;
  const bondGap = goalBond - currentBond;

  const formatMoney = (val: number) => 
    new Intl.NumberFormat('zh-TW').format(Math.abs(Math.round(val)));

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600">
          <Wallet size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">再平衡建議 (Rebalancing Strategy)</h3>
          <p className="text-sm text-slate-500">
            目標投入: 700萬 (60% 股 / 40% 債) | 目前閒置資金: ${formatMoney(availableCash)}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Stock Action */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3">
             <div className={`p-2 rounded-full ${stockGap > 0 ? 'bg-red-100 text-tw-up' : 'bg-green-100 text-tw-down'}`}>
                {stockGap > 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
             </div>
             <div>
               <p className="font-semibold text-slate-700">股票部位 (Stocks)</p>
               <p className="text-xs text-slate-500">目前: {formatMoney(currentStock)} / 目標: {formatMoney(goalStock)}</p>
             </div>
          </div>
          <div className="text-right">
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${stockGap > 0 ? 'bg-red-100 text-tw-up' : 'bg-green-100 text-tw-down'}`}>
              {stockGap > 0 ? '買入 (Buy)' : '賣出 (Sell)'}
            </span>
            <p className="text-lg font-bold mt-1 text-slate-800">${formatMoney(stockGap)}</p>
          </div>
        </div>

        {/* Bond Action */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3">
             <div className={`p-2 rounded-full ${bondGap > 0 ? 'bg-red-100 text-tw-up' : 'bg-green-100 text-tw-down'}`}>
                {bondGap > 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
             </div>
             <div>
               <p className="font-semibold text-slate-700">債券部位 (Bonds)</p>
               <p className="text-xs text-slate-500">目前: {formatMoney(currentBond)} / 目標: {formatMoney(goalBond)}</p>
             </div>
          </div>
          <div className="text-right">
             <span className={`text-sm font-bold px-3 py-1 rounded-full ${bondGap > 0 ? 'bg-red-100 text-tw-up' : 'bg-green-100 text-tw-down'}`}>
              {bondGap > 0 ? '買入 (Buy)' : '賣出 (Sell)'}
            </span>
            <p className="text-lg font-bold mt-1 text-slate-800">${formatMoney(bondGap)}</p>
          </div>
        </div>

        {/* Execution Summary */}
        <div className="mt-4 pt-4 border-t border-slate-200">
           <div className="flex items-start gap-2">
             <ArrowRight className="text-indigo-500 mt-1 flex-shrink-0" size={18} />
             <p className="text-sm text-slate-600 leading-relaxed">
               建議操作：請利用閒置資金優先補足
               <span className="font-bold text-slate-900 mx-1">
                 {stockGap > bondGap ? '股票 ETF' : '債券 ETF'}
               </span>
               部位。目前距離700萬投入目標尚需投入 
               <span className="font-bold text-indigo-600 mx-1">
                 ${formatMoney(stockGap + bondGap)}
               </span>。
             </p>
           </div>
        </div>
      </div>
    </div>
  );
};