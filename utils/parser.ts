import { Holding, AssetType } from '../types';
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