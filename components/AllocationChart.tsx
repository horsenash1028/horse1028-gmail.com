import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AssetType } from '../types';

interface AllocationChartProps {
  stockValue: number;
  bondValue: number;
  cashValue: number;
}

export const AllocationChart: React.FC<AllocationChartProps> = ({ stockValue, bondValue, cashValue }) => {
  
  const data = [
    { name: '股票 (Stock)', value: stockValue, type: AssetType.Stock },
    { name: '債券 (Bond)', value: bondValue, type: AssetType.Bond },
    { name: '現金 (Cash)', value: cashValue, type: AssetType.Cash },
  ];

  const COLORS = ['#3b82f6', '#f59e0b', '#cbd5e1']; // Blue, Amber, Slate

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="h-80 w-full bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center">
      <h3 className="text-lg font-bold text-slate-800 self-start mb-4">資產配置分佈 (Asset Allocation)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend verticalAlign="bottom" height={36}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};