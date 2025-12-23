import { Holding, AssetType, DividendRecord } from '../types';
import { ETF_CATEGORY_MAP } from '../constants';

const cleanNumber = (str: string | number): number => {
  if (typeof str === 'number') return str;
  return parseFloat(str.replace(/,/g, '').replace(/"/g, ''));
};

const cleanPercentage = (str: string): number => {
  return parseFloat(str.replace('%', ''));
};

export const parseCSVData = (csv: string): Holding[] => {
  const lines = csv.trim().split('\n');
  const holdings: Holding[] = [];

  // Skip header (index 0)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Simple CSV split logic handling quotes
    // Matches: "123,456" or 123
    const regex = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
    const matches = line.match(regex);
    
    if (!matches || matches.length < 10) continue;

    // Remove quotes manually for cleaner processing
    const values = matches.map(val => val.replace(/^"|"$/g, '').replace(/,$/, ''));
    
    // Mapping based on provided CSV structure:
    // Name[0], Shares[1], PL[2], Type[3], AvgPrice[4], MktPrice[5], Value[6], Cost[7], PL2[8], Return[9]
    
    const name = values[0];
    const type = ETF_CATEGORY_MAP[name] || AssetType.Stock; // Default to Stock if unknown

    holdings.push({
      name: name,
      shares: cleanNumber(values[1]),
      totalProfitLoss: cleanNumber(values[2]),
      avgPrice: cleanNumber(values[4]),
      currentPrice: cleanNumber(values[5]),
      currentValue: cleanNumber(values[6]),
      cost: cleanNumber(values[7]),
      returnRate: cleanPercentage(values[9]),
      type: type
    });
  }

  return holdings;
};

// --- Backup / Restore Utilities ---

export const generateBackupCSV = (holdings: Holding[], dividends: DividendRecord[]): string => {
  const lines: string[] = [];
  lines.push('SmartPortfolio_Backup_v1'); // Version Header
  
  lines.push('[HOLDINGS]');
  lines.push('name,shares,avgPrice,currentPrice,type');
  holdings.forEach(h => {
    lines.push(`"${h.name}",${h.shares},${h.avgPrice},${h.currentPrice},${h.type}`);
  });

  lines.push(''); // Empty line for readability
  lines.push('[DIVIDENDS]');
  lines.push('id,date,stockName,amount');
  dividends.forEach(d => {
    lines.push(`"${d.id}",${d.date},"${d.stockName}",${d.amount}`);
  });

  return lines.join('\n');
};

export const parseBackupCSV = (csv: string): { holdings: Holding[], dividends: DividendRecord[] } => {
  const lines = csv.split('\n').map(l => l.trim()).filter(l => l);
  const holdings: Holding[] = [];
  const dividends: DividendRecord[] = [];
  
  // Constants for calc (Sync with App.tsx)
  const FEE_RATE = 0.001425;
  const DISCOUNT = 0.28;
  const STOCK_TAX_RATE = 0.001;
  
  const BUY_COST_FACTOR = 1 + (FEE_RATE * DISCOUNT);
  
  const getSellValFactor = (type: AssetType) => {
    const tax = type === AssetType.Bond ? 0 : STOCK_TAX_RATE;
    return 1 - (FEE_RATE * DISCOUNT) - tax;
  };
  
  let currentSection = '';

  // Helper to parse CSV line
  const parseLine = (str: string) => {
    const result: string[] = [];
    let start = 0;
    let inQuotes = false;
    for (let j = 0; j < str.length; j++) {
        if (str[j] === '"') inQuotes = !inQuotes;
        if (str[j] === ',' && !inQuotes) {
            result.push(str.substring(start, j).replace(/^"|"$/g, ''));
            start = j + 1;
        }
    }
    result.push(str.substring(start).replace(/^"|"$/g, ''));
    return result;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check Sections
    if (line === '[HOLDINGS]') {
      currentSection = 'HOLDINGS';
      continue;
    } else if (line === '[DIVIDENDS]') {
      currentSection = 'DIVIDENDS';
      continue;
    }

    // Skip Headers and metadata
    if (line.startsWith('SmartPortfolio_Backup_v1')) continue;
    if (line.startsWith('name,shares') || line.startsWith('id,date')) continue;

    const cols = parseLine(line);

    if (currentSection === 'HOLDINGS') {
       if (cols.length < 5) continue;
       const [name, sharesStr, avgPriceStr, currentPriceStr, typeStr] = cols;
       const shares = parseFloat(sharesStr);
       const avgPrice = parseFloat(avgPriceStr);
       const currentPrice = parseFloat(currentPriceStr);
       const type = typeStr as AssetType;
       
       const sellFactor = getSellValFactor(type);

       // Re-calculate derived fields to ensure consistency with App logic
       const cost = Math.round(shares * avgPrice * BUY_COST_FACTOR);
       const currentValue = Math.round(shares * currentPrice * sellFactor);
       const totalProfitLoss = currentValue - cost;
       const returnRate = cost !== 0 ? (totalProfitLoss / cost) * 100 : 0;
       
       holdings.push({
         name,
         shares,
         avgPrice,
         currentPrice,
         type,
         cost,
         currentValue,
         totalProfitLoss,
         returnRate
       });
    } else if (currentSection === 'DIVIDENDS') {
       if (cols.length < 4) continue;
       const [id, date, stockName, amountStr] = cols;
       dividends.push({
         id,
         date,
         stockName,
         amount: parseFloat(amountStr)
       });
    }
  }

  return { holdings, dividends };
};