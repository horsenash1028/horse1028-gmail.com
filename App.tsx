import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { LayoutDashboard, Coins, PieChart as PieChartIcon, Target, TrendingUp, Download, Upload, FileJson } from 'lucide-react';

import { RAW_CSV_DATA, INITIAL_CONFIG, INITIAL_DIVIDENDS } from './constants';
import { parseCSVData, generateBackupCSV, parseBackupCSV } from './utils/parser';
import { AssetType, Holding, DividendRecord, BackupData } from './types';

import { MetricCard } from './components/MetricCard';
import { AllocationChart } from './components/AllocationChart';
import { RebalanceCard } from './components/RebalanceCard';
import { HoldingsTable } from './components/HoldingsTable';
import { DividendDashboard } from './components/DividendDashboard';

const App: React.FC = () => {
  // Constants for calculation
  // Cost = (Shares * AvgPrice) + (Shares * AvgPrice * 0.1425% * 28%)
  // Value (Stock) = (Shares * CurrentPrice) - (Shares * CurrentPrice * 0.1425% * 28%) - (Shares * CurrentPrice * 0.1%)
  // Value (Bond)  = (Shares * CurrentPrice) - (Shares * CurrentPrice * 0.1425% * 28%)  <-- No Tax
  const FEE_RATE = 0.001425;
  const DISCOUNT = 0.28;
  const STOCK_TAX_RATE = 0.001; // 0.1% for stocks
  
  const BUY_COST_FACTOR = 1 + (FEE_RATE * DISCOUNT);

  // Helper to determine Sell Factor based on Asset Type
  const getSellValFactor = (type: AssetType) => {
    const tax = type === AssetType.Bond ? 0 : STOCK_TAX_RATE;
    return 1 - (FEE_RATE * DISCOUNT) - tax;
  };

  // 1. Initialize State from parsed Data
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [dividends, setDividends] = useState<DividendRecord[]>(INITIAL_DIVIDENDS);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHoldings(parseCSVData(RAW_CSV_DATA));
  }, []);

  // Handler for updating holdings
  const handleUpdateHolding = useCallback((index: number, field: 'shares' | 'currentPrice' | 'currentValue' | 'cost' | 'avgPrice', value: number) => {
    setHoldings(prev => {
      const newHoldings = [...prev];
      const h = { ...newHoldings[index] };
      
      const sellFactor = getSellValFactor(h.type);

      // Update the specific field and dependent fields
      if (field === 'shares') {
        h.shares = value;
        // Recalculate based on new formulas
        h.currentValue = Math.round(value * h.currentPrice * sellFactor);
        h.cost = Math.round(value * h.avgPrice * BUY_COST_FACTOR);
      } else if (field === 'currentPrice') {
        h.currentPrice = value;
        h.currentValue = Math.round(h.shares * value * sellFactor);
      } else if (field === 'currentValue') {
        h.currentValue = value;
        // Reverse calc: Price = Value / (Shares * Factor)
        h.currentPrice = h.shares > 0 ? value / (h.shares * sellFactor) : 0;
      } else if (field === 'avgPrice') {
        h.avgPrice = value;
        h.cost = Math.round(h.shares * value * BUY_COST_FACTOR);
      } else if (field === 'cost') {
        h.cost = value;
        // Reverse calc: AvgPrice = Cost / (Shares * Factor)
        h.avgPrice = h.shares > 0 ? value / (h.shares * BUY_COST_FACTOR) : 0;
      }

      // Always recalculate Profit/Loss and Return Rate
      h.totalProfitLoss = h.currentValue - h.cost;
      h.returnRate = h.cost !== 0 ? (h.totalProfitLoss / h.cost) * 100 : 0;

      newHoldings[index] = h;
      return newHoldings;
    });
  }, [BUY_COST_FACTOR]);

  const handleAddDividend = (record: Omit<DividendRecord, 'id'>) => {
    const newRecord: DividendRecord = {
      ...record,
      id: Math.random().toString(36).substr(2, 9)
    };
    setDividends(prev => [...prev, newRecord]);
  };

  // --- Export / Import Logic (CSV) ---
  const handleExportData = () => {
    const csvContent = generateBackupCSV(holdings, dividends);
    
    // Create Blob with UTF-8 BOM for Excel compatibility (optional but good for CSV)
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const href = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = href;
    link.download = `smartportfolio_backup_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const { holdings: newHoldings, dividends: newDividends } = parseBackupCSV(content);
        
        // Basic validation
        if (newHoldings.length > 0 || newDividends.length > 0) {
          setHoldings(newHoldings);
          setDividends(newDividends);
          alert('資料匯入成功！');
        } else {
          alert('檔案格式錯誤或內容為空');
        }
      } catch (error) {
        console.error('Import error:', error);
        alert('匯入失敗：無法解析 CSV 檔案');
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be selected again if needed
    event.target.value = '';
  };

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

  const holdingNames = useMemo(() => holdings.map(h => h.name), [holdings]);

  return (
    <div className="min-h-screen pb-12">
      {/* Hidden File Input for Import */}
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv"
        className="hidden" 
      />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <LayoutDashboard size={20} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight hidden sm:block">SmartPortfolio TW</h1>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight sm:hidden">SP-TW</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-4 text-sm text-slate-500 mr-4 border-r border-slate-200 pr-4">
              <span>目標資產: {fCurrency(INITIAL_CONFIG.totalAssetsGoal)}</span>
              <span>|</span>
              <span>目標投入: {fCurrency(INITIAL_CONFIG.investedGoal)}</span>
            </div>
            
            <button 
              onClick={handleExportData}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              title="匯出 CSV 資料"
            >
              <Download size={16} />
              <span className="hidden sm:inline">匯出</span>
            </button>
            <button 
              onClick={handleImportClick}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              title="匯入 CSV 資料"
            >
              <Upload size={16} />
              <span className="hidden sm:inline">匯入</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        
        {/* Section 1: Portfolio Overview */}
        <section className="space-y-8">
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
        </section>

        <hr className="border-slate-200" />

        {/* Section 2: Dividend Dashboard */}
        <section>
          <DividendDashboard 
            dividends={dividends} 
            holdingNames={holdingNames}
            onAddDividend={handleAddDividend}
          />
        </section>

      </main>
    </div>
  );
};

export default App;