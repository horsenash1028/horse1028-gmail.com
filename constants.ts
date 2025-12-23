import { AssetType } from './types';

// The raw CSV data provided by the user
export const RAW_CSV_DATA = `股票名稱,股數,總損益,交易別,成交均價,市價,現值,付出成本,預估損益,報酬率,幣別
元大台灣50,"22,000","26,117",現股,62.35,63.65,"1,398,355","1,372,238","26,117",1.90%,台幣
元大高股息,"20,000","11,980",現股,35.96,36.62,"731,382","719,402","11,980",1.67%,台幣
元大美債20年,"45,000","-16,495",現股,27.62,27.28,"1,227,116","1,243,611","-16,495",-1.33%,台幣
元大投資級公司債,"30,000","-2,038",現股,33.74,33.7,"1,010,600","1,012,638","-2,038",-0.20%,台幣
群益台灣精選高息,"40,000","29,971",現股,21.62,22.41,"895,152","865,181","29,971",3.46%,台幣
群益ESG投等債20+,"45,000","-4,488",現股,15.17,15.08,"678,330","682,818","-4,488",-0.66%,台幣`;

// Mapping ETF names to Asset Types based on standard knowledge of TW ETFs
export const ETF_CATEGORY_MAP: Record<string, AssetType> = {
  '元大台灣50': AssetType.Stock,
  '元大高股息': AssetType.Stock,
  '元大美債20年': AssetType.Bond,
  '元大投資級公司債': AssetType.Bond,
  '群益台灣精選高息': AssetType.Stock,
  '群益ESG投等債20+': AssetType.Bond,
};

export const INITIAL_CONFIG = {
  totalAssetsGoal: 8000000,
  investedGoal: 7000000,
  cashReserveGoal: 1000000,
  stockRatio: 0.6,
  bondRatio: 0.4,
};