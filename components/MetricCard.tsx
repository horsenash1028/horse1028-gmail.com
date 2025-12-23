import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  highlight?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  subValue, 
  trend, 
  icon,
  highlight = false
}) => {
  
  // Taiwan Market Colors: Up = Red, Down = Green
  const trendColor = trend === 'up' ? 'text-tw-up' : trend === 'down' ? 'text-tw-down' : 'text-slate-600';
  
  return (
    <div className={`p-5 rounded-2xl border ${highlight ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100'} shadow-sm flex flex-col justify-between`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-slate-500">{title}</h3>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-bold ${trend ? trendColor : 'text-slate-900'}`}>
          {value}
        </span>
        {subValue && (
          <span className="text-sm font-medium text-slate-400">
            {subValue}
          </span>
        )}
      </div>
    </div>
  );
};