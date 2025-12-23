import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { LayoutDashboard, Coins, PieChart as PieChartIcon, Target, TrendingUp } from 'lucide-react';

import { RAW_CSV_DATA, INITIAL_CONFIG } from './constants';
import { parseCSVData } from './utils/parser';
import { AssetType, Holding } from './types';

import { MetricCard } from './components/MetricCard';
import { AllocationChart } from './components/AllocationChart';
import { RebalanceCard } from './components/RebalanceCard';
import { HoldingsTable } from './components/HoldingsTable';

const App: React.FC = () => {
  // 1. Initialize State from parsed Data
  const [holdings, setHoldings] = useState<Holding[]>([]);

  useEffect(() => {
    setHoldings(parseCSVData(RAW_CSV_DATA));
  }, []);

  // Handler for updating holdings
  const handleUpdateHolding = useCallback((index: number, field: 'currentPrice' | 'currentValue' | 'cost', value: number) => {
    setHoldings(prev => {
      const newHoldings = [...prev];
      const h = { ...newHoldings[index] };

      // Update the specific field and dependent fields
      if (field === 'currentPrice') {
        h.currentPrice = value;
        h.currentValue = Math.round(h.shares * value);
      } else if (field === 'currentValue') {
        h.currentValue = value;
        h.currentPrice = h.shares > 0 ? value / h.shares : 0;
      } else if (field === 'cost') {
        h.cost = value;
      }

      // Always recalculate Profit/Loss and Return Rate
      h.totalProfitLoss = h.currentValue - h.cost;
      h.returnRate = h.cost !== 0 ? (h.totalProfitLoss / h.cost) * 100 : 0;

      newHoldings[index] = h;
      return newHoldings;
    });
  }, []);

  // 2. Calculate Current Metrics (derived from state)
  const portfolioMetrics = useMemo(() => {
    let stockVal = 0;
    let bondVal = 0;
    let totalPL = 0;
    let totalCurrentVal = 0;
    let totalCost = 0;

    holdings.forEach(h => {
      if (h.type === AssetType.Stock) stockVal += h.currentValue;
      if (h.type === AssetType.Bond) bondVal += h.currentValue;
      totalPL += h.totalProfitLoss;
      totalCurrentVal += h.currentValue;
      totalCost += h.cost;
    });

    const totalAssets = INITIAL_CONFIG.totalAssetsGoal; // 8M total
    // Calculate actual cash based on user's statement of 8M Total - Portfolio Value
    // Note: If portfolio value changes due to price edits, cash implies the remainder of the 8M asset pie
    const cashVal = totalAssets - totalCurrentVal;

    return {
      stockVal,
      bondVal,
      cashVal,
      totalPL,
      totalCurrentVal,
      totalCost,
      totalAssets
    };
  }, [holdings]);

  // 3. Current Ratios
  const investedTotal = portfolioMetrics.stockVal + portfolioMetrics.bondVal;
  const currentStockRatio = investedTotal > 0 ? (portfolioMetrics.stockVal / investedTotal) * 100 : 0;
  const currentBondRatio = investedTotal > 0 ? (portfolioMetrics.bondVal / investedTotal) * 100 : 0;
  const totalReturnRate = portfolioMetrics.totalCost > 0 ? (portfolioMetrics.totalPL / portfolioMetrics.totalCost) * 100 : 0;

  // Formatters
  const fCurrency = (num: number) => new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 }).format(num);

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <LayoutDashboard size={20} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">SmartPortfolio TW</h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span>目標資產: {fCurrency(INITIAL_CONFIG.totalAssetsGoal)}</span>
            <span className="hidden sm:inline">|</span>
            <span className="hidden sm:inline">目標投入: {fCurrency(INITIAL_CONFIG.investedGoal)}</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard 
            title="總資產 (Total Assets)" 
            value={fCurrency(portfolioMetrics.totalAssets)} 
            icon={<Coins size={20} />}
            highlight
          />
          <MetricCard 
            title="目前持倉總值 (Portfolio Value)" 
            value={fCurrency(portfolioMetrics.totalCurrentVal)} 
            subValue={`成本 ${fCurrency(portfolioMetrics.totalCost)}`}
            icon={<PieChartIcon size={20} />}
          />
          <MetricCard 
            title="未實現損益 (Unrealized P/L)" 
            value={fCurrency(portfolioMetrics.totalPL)} 
            trend={portfolioMetrics.totalPL >= 0 ? 'up' : 'down'}
            icon={<TrendingUp size={20} />}
          />
           <MetricCard 
            title="總報酬率 (Total Return)" 
            value={`${totalReturnRate.toFixed(2)}%`}
            trend={totalReturnRate >= 0 ? 'up' : 'down'}
            icon={<Target size={20} />}
          />
        </div>

        {/* Charts and Rebalancing Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: Charts & Current Ratio */}
          <div className="lg:col-span-1 space-y-6">
            <AllocationChart 
              stockValue={portfolioMetrics.stockVal} 
              bondValue={portfolioMetrics.bondVal} 
              cashValue={portfolioMetrics.cashVal}
            />
            
            {/* Simple Ratio Bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-sm font-bold text-slate-700 mb-3">股債現況比 (Stock/Bond Ratio)</h3>
              <div className="h-4 w-full bg-amber-400 rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-blue-500 transition-all duration-500" 
                  style={{ width: `${currentStockRatio}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs font-medium text-slate-600">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  股票 {currentStockRatio.toFixed(1)}%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  債券 {currentBondRatio.toFixed(1)}%
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-400 text-center">
                目標: 60% / 40%
              </div>
            </div>
          </div>

          {/* Right: Rebalancing & Strategy */}
          <div className="lg:col-span-2 space-y-6">
            <RebalanceCard 
              currentStock={portfolioMetrics.stockVal}
              currentBond={portfolioMetrics.bondVal}
              currentCash={portfolioMetrics.cashVal}
              targetInvested={INITIAL_CONFIG.investedGoal}
              targetStockRatio={INITIAL_CONFIG.stockRatio}
              targetBondRatio={INITIAL_CONFIG.bondRatio}
              availableCash={portfolioMetrics.cashVal - INITIAL_CONFIG.cashReserveGoal}
            />
            
            {/* Reserve Cash Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                <h4 className="text-emerald-800 font-bold text-sm mb-1">緊急預備金/定存 (Reserve)</h4>
                <p className="text-2xl font-bold text-emerald-700">{fCurrency(INITIAL_CONFIG.cashReserveGoal)}</p>
                <p className="text-xs text-emerald-600 mt-1">股市下跌10%時進場資金</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-slate-800 font-bold text-sm mb-1">目前閒置資金 (Available Cash)</h4>
                 <p className="text-2xl font-bold text-slate-700">{fCurrency(portfolioMetrics.cashVal)}</p>
                 <p className="text-xs text-slate-500 mt-1">包含預備金與待投入資金</p>
              </div>
            </div>
          </div>
        </div>

        {/* Holdings Table */}
        <HoldingsTable 
          holdings={holdings} 
          onUpdate={handleUpdateHolding}
        />

      </main>
    </div>
  );
};

export default App;