// ============ PERFORMANCE DATA ============
type WfItem = { name: string; value: number; isTotal: boolean };

const mkWf = (sp: number, mts: number, as_val: number, inf: number): WfItem[] => [
  { name: 'Strategic Portfolio', value: sp, isTotal: false },
  { name: 'MTS', value: mts, isTotal: false },
  { name: 'Active Strategies', value: as_val, isTotal: false },
  { name: 'Total Portfolio', value: sp + mts + as_val, isTotal: true },
  { name: 'Inflation', value: inf, isTotal: false },
  { name: 'Real Return', value: sp + mts + as_val + inf, isTotal: true },
];

export const perfWaterfallData: Record<string, WfItem[]> = {
  '1Y': mkWf(8.5, 1.2, 0.8, -3.2),
  '3Y': mkWf(6.2, 0.9, 1.1, -2.8),
  '5Y': mkWf(7.1, 1.0, 0.6, -2.5),
  '10Y': mkWf(6.8, 0.8, 0.9, -2.2),
  '20Y': mkWf(7.5, 0.7, 0.5, -2.0),
};

export const currencies = ['USD', 'SGD', 'RLCL'] as const;
export const timespans = ['1Y', '3Y', '5Y', '10Y', '20Y'] as const;

// Active strategies
export const activeStrategies = [
  { name: 'Global Equities Alpha', contribution: 0.35, ownReturn: 12.4 },
  { name: 'EM Debt Opportunities', contribution: 0.18, ownReturn: 8.7 },
  { name: 'Real Estate Core', contribution: 0.12, ownReturn: 6.2 },
  { name: 'Infrastructure Growth', contribution: 0.08, ownReturn: 9.1 },
  { name: 'Private Equity Co-Invest', contribution: 0.22, ownReturn: 15.3 },
  { name: 'Systematic Macro', contribution: -0.05, ownReturn: -2.1 },
  { name: 'Credit Opportunities', contribution: 0.15, ownReturn: 7.8 },
  { name: 'Commodity Trading', contribution: -0.08, ownReturn: -3.5 },
  { name: 'FX Overlay', contribution: 0.03, ownReturn: 1.2 },
  { name: 'Rates Relative Value', contribution: 0.05, ownReturn: 3.4 },
];

// Time series helpers — timespan-aware
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getTimeLabels(timespan: string): string[] {
  switch (timespan) {
    case '1Y': return months;
    case '3Y': return ['Y1 H1', 'Y1 H2', 'Y2 H1', 'Y2 H2', 'Y3 H1', 'Y3 H2'];
    case '5Y': return ['Y1', 'Y2', 'Y3', 'Y4', 'Y5'];
    case '10Y': return ['Y1', 'Y2', 'Y3', 'Y4', 'Y5', 'Y6', 'Y7', 'Y8', 'Y9', 'Y10'];
    case '20Y': return ['Y1-2', 'Y3-4', 'Y5-6', 'Y7-8', 'Y9-10', 'Y11-12', 'Y13-14', 'Y15-16', 'Y17-18', 'Y19-20'];
    default: return months;
  }
}

// Simple deterministic random from numeric seed
function numericRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Time series (monthly, last 12 months) — legacy static for backward compat
export const perfTimeSeries = months.map((m, i) => {
  const sp = +(3 + Math.sin(i / 2) * 2 + i * 0.5).toFixed(1);
  const mts = +(0.5 + seededRandom(i * 7 + 1) * 0.8).toFixed(1);
  const as_ = +(0.2 + seededRandom(i * 7 + 2) * 0.6).toFixed(1);
  const tp = +(sp + mts + as_).toFixed(1);
  const inflation = +(-0.2 - seededRandom(i * 7 + 3) * 0.4).toFixed(1);
  const realReturn = +(tp + inflation).toFixed(1);
  return { month: m, strategicPortfolio: sp, mts, activeStrategies: as_, totalPortfolio: tp, inflation, realReturn };
});

export function generatePerfTimeSeries(timespan: string) {
  const labels = getTimeLabels(timespan);
  const scale = timespan === '1Y' ? 1 : timespan === '3Y' ? 3 : timespan === '5Y' ? 5 : timespan === '10Y' ? 10 : 20;
  return labels.map((m, i) => {
    const frac = (i + 1) / labels.length;
    const sp = +(3 * scale * frac + Math.sin(i / 2) * 2).toFixed(1);
    const mts = +(0.5 * scale * frac + seededRandom(i * 7 + 1) * 0.8).toFixed(1);
    const as_ = +(0.2 * scale * frac + seededRandom(i * 7 + 2) * 0.6).toFixed(1);
    const tp = +(sp + mts + as_).toFixed(1);
    const inflation = +(-0.2 * scale * frac - seededRandom(i * 7 + 3) * 0.4).toFixed(1);
    const realReturn = +(tp + inflation).toFixed(1);
    return { month: m, strategicPortfolio: sp, mts, activeStrategies: as_, totalPortfolio: tp, inflation, realReturn };
  });
}

export const cumulativePerfSeries = months.map((m, i) => {
  const base: Record<string, number | string> = { month: m };
  activeStrategies.slice(0, 6).forEach(s => {
    base[s.name] = +((i + 1) * (s.ownReturn / 12) + seededRandom(i * 13 + s.name.length) * 0.5).toFixed(2);
  });
  base['Total Portfolio'] = +((i + 1) * 0.85 + seededRandom(i * 17) * 0.3).toFixed(2);
  return base;
});

export function generateCumulativePerfSeries(timespan: string, strategies: { name: string; ownReturn: number }[]) {
  const labels = getTimeLabels(timespan);
  const scale = timespan === '1Y' ? 1 : timespan === '3Y' ? 3 : timespan === '5Y' ? 5 : timespan === '10Y' ? 10 : 20;
  return labels.map((m, i) => {
    const base: Record<string, number | string> = { month: m };
    strategies.forEach(s => {
      base[s.name] = +((i + 1) / labels.length * scale * (s.ownReturn / 1) + seededRandom(i * 13 + s.name.length) * 0.5).toFixed(2);
    });
    base['Total Portfolio'] = +((i + 1) / labels.length * scale * 0.85 + seededRandom(i * 17) * 0.3).toFixed(2);
    return base;
  });
}

// Contribution time series
export const contributionTimeSeries = months.map((m, i) => {
  const base: Record<string, number | string> = { month: m };
  let sum = 0;
  activeStrategies.slice(0, 6).forEach(s => {
    const val = +(s.contribution * (i + 1) / 6 + (seededRandom(i * 11 + s.name.length) - 0.5) * 0.1).toFixed(2);
    base[s.name] = val;
    sum += val;
  });
  base['Total Portfolio'] = +sum.toFixed(2);
  return base;
});

export function generateContributionTimeSeries(timespan: string, strategies: { name: string; contribution: number }[]) {
  const labels = getTimeLabels(timespan);
  const scale = timespan === '1Y' ? 1 : timespan === '3Y' ? 3 : timespan === '5Y' ? 5 : timespan === '10Y' ? 10 : 20;
  return labels.map((m, i) => {
    const base: Record<string, number | string> = { month: m };
    let sum = 0;
    strategies.forEach(s => {
      const val = +(s.contribution * scale * (i + 1) / labels.length + (seededRandom(i * 11 + s.name.length) - 0.5) * 0.1).toFixed(2);
      base[s.name] = val;
      sum += val;
    });
    base['Total Portfolio'] = +sum.toFixed(2);
    return base;
  });
}

export { getTimeLabels };

// ============ COUNTRY EXPOSURE ============
export const countryExposureData = [
  { name: 'United States', benchmark: 45.2, totalPortfolio: 42.1, market: 'DM' as const },
  { name: 'United Kingdom', benchmark: 8.5, totalPortfolio: 9.2, market: 'DM' as const },
  { name: 'Japan', benchmark: 7.8, totalPortfolio: 6.5, market: 'DM' as const },
  { name: 'China', benchmark: 6.2, totalPortfolio: 8.1, market: 'EM' as const },
  { name: 'Germany', benchmark: 4.5, totalPortfolio: 4.8, market: 'DM' as const },
  { name: 'France', benchmark: 3.8, totalPortfolio: 3.5, market: 'DM' as const },
  { name: 'Canada', benchmark: 3.2, totalPortfolio: 3.9, market: 'DM' as const },
  { name: 'Australia', benchmark: 2.8, totalPortfolio: 3.2, market: 'DM' as const },
  { name: 'South Korea', benchmark: 2.1, totalPortfolio: 2.5, market: 'EM' as const },
  { name: 'India', benchmark: 1.8, totalPortfolio: 2.8, market: 'EM' as const },
  { name: 'Brazil', benchmark: 1.5, totalPortfolio: 1.2, market: 'EM' as const },
  { name: 'Others', benchmark: 12.6, totalPortfolio: 12.2, market: 'DM' as const },
];

export const sectorExposureData = [
  { name: 'Information Technology', benchmark: 22.5, totalPortfolio: 24.1 },
  { name: 'Financials', benchmark: 15.8, totalPortfolio: 14.2 },
  { name: 'Healthcare', benchmark: 12.2, totalPortfolio: 11.5 },
  { name: 'Consumer Discretionary', benchmark: 10.5, totalPortfolio: 11.8 },
  { name: 'Industrials', benchmark: 9.8, totalPortfolio: 9.2 },
  { name: 'Energy', benchmark: 5.2, totalPortfolio: 4.8 },
  { name: 'Materials', benchmark: 4.5, totalPortfolio: 5.1 },
  { name: 'Real Estate', benchmark: 3.8, totalPortfolio: 4.5 },
  { name: 'Utilities', benchmark: 3.2, totalPortfolio: 2.8 },
  { name: 'Communication Services', benchmark: 7.5, totalPortfolio: 7.2 },
  { name: 'Consumer Staples', benchmark: 5.0, totalPortfolio: 4.8 },
];

export const nameExposureData = [
  { name: 'Apple Inc.', benchmark: 4.8, totalPortfolio: 5.2 },
  { name: 'Microsoft Corp.', benchmark: 4.2, totalPortfolio: 4.5 },
  { name: 'NVIDIA Corp.', benchmark: 3.5, totalPortfolio: 4.1 },
  { name: 'Amazon.com Inc.', benchmark: 2.8, totalPortfolio: 2.5 },
  { name: 'Alphabet Inc.', benchmark: 2.5, totalPortfolio: 2.8 },
  { name: 'Meta Platforms', benchmark: 1.8, totalPortfolio: 2.1 },
  { name: 'Berkshire Hathaway', benchmark: 1.5, totalPortfolio: 1.2 },
  { name: 'Tesla Inc.', benchmark: 1.2, totalPortfolio: 1.5 },
  { name: 'JPMorgan Chase', benchmark: 1.1, totalPortfolio: 1.3 },
  { name: 'Samsung Electronics', benchmark: 0.9, totalPortfolio: 1.1 },
  { name: 'Others', benchmark: 75.7, totalPortfolio: 73.7 },
];

export const currencyExposureData = [
  { name: 'USD', benchmark: 52.5, totalPortfolio: 50.2, market: 'DM' as const },
  { name: 'EUR', benchmark: 15.8, totalPortfolio: 14.5, market: 'DM' as const },
  { name: 'GBP', benchmark: 8.2, totalPortfolio: 9.1, market: 'DM' as const },
  { name: 'JPY', benchmark: 7.5, totalPortfolio: 6.2, market: 'DM' as const },
  { name: 'CNY', benchmark: 4.8, totalPortfolio: 6.5, market: 'EM' as const },
  { name: 'AUD', benchmark: 2.5, totalPortfolio: 3.1, market: 'DM' as const },
  { name: 'CAD', benchmark: 2.8, totalPortfolio: 3.2, market: 'DM' as const },
  { name: 'KRW', benchmark: 1.5, totalPortfolio: 2.0, market: 'EM' as const },
  { name: 'SGD', benchmark: 1.2, totalPortfolio: 1.8, market: 'DM' as const },
  { name: 'Others', benchmark: 3.2, totalPortfolio: 3.4, market: 'EM' as const },
];

export const assetClassExposureData = [
  { name: 'Public Equities', benchmark: 45.0, totalPortfolio: 43.5 },
  { name: 'Fixed Income', benchmark: 25.0, totalPortfolio: 22.8 },
  { name: 'Real Estate', benchmark: 10.0, totalPortfolio: 12.5 },
  { name: 'Infrastructure', benchmark: 8.0, totalPortfolio: 9.2 },
  { name: 'Private Equity', benchmark: 7.0, totalPortfolio: 8.5 },
  { name: 'Commodities', benchmark: 3.0, totalPortfolio: 2.0 },
  { name: 'Cash & Equivalents', benchmark: 2.0, totalPortfolio: 1.5 },
];

// Period labels
const periodLabels = {
  '1Y': months, // 12 monthly
  '5Y': ['Q1 22', 'Q2 22', 'Q3 22', 'Q4 22', 'Q1 23', 'Q2 23', 'Q3 23', 'Q4 23', 'Q1 24', 'Q2 24', 'Q3 24', 'Q4 24', 'Q1 25', 'Q2 25', 'Q3 25', 'Q4 25', 'Q1 26', 'Q2 26', 'Q3 26', 'Q4 26'],
  '10Y': ['2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'],
};

// Exposure time series (period-aware)
export const exposureTimeSeries = (data: { name: string; benchmark: number; totalPortfolio: number }[], period: string = '1Y') => {
  const labels = periodLabels[period as keyof typeof periodLabels] || months;
  return labels.map((m, i) =>
    data.reduce(
      (acc, d) => ({
        ...acc,
        [`${d.name}_bm`]: +(d.benchmark + (Math.random() - 0.5) * 2).toFixed(1),
        [`${d.name}_tp`]: +(d.totalPortfolio + (Math.random() - 0.5) * 2).toFixed(1),
      }),
      { month: m } as Record<string, string | number>
    )
  );
};

// ============ EXPOSURE WATERFALL ============
// Waterfall: Strategic BM + SAA Tilt = LTCA, LTCA + Active Mgmt = Total Portfolio
export const exposureWaterfallData: Record<string, Record<string, WfItem[]>> = {
  country: {
    'United States': [
      { name: 'Strategic\nBenchmark', value: 40.0, isTotal: false },
      { name: 'SAA\nTilt', value: 5.2, isTotal: false },
      { name: 'LTCA', value: 45.2, isTotal: true },
      { name: 'Active\nMgmt', value: -3.1, isTotal: false },
      { name: 'Total\nPortfolio', value: 42.1, isTotal: true },
    ],
    'United Kingdom': [
      { name: 'Strategic\nBenchmark', value: 7.0, isTotal: false },
      { name: 'SAA\nTilt', value: 1.5, isTotal: false },
      { name: 'LTCA', value: 8.5, isTotal: true },
      { name: 'Active\nMgmt', value: 0.7, isTotal: false },
      { name: 'Total\nPortfolio', value: 9.2, isTotal: true },
    ],
    'Japan': [
      { name: 'Strategic\nBenchmark', value: 6.5, isTotal: false },
      { name: 'SAA\nTilt', value: 1.3, isTotal: false },
      { name: 'LTCA', value: 7.8, isTotal: true },
      { name: 'Active\nMgmt', value: -1.3, isTotal: false },
      { name: 'Total\nPortfolio', value: 6.5, isTotal: true },
    ],
    'China': [
      { name: 'Strategic\nBenchmark', value: 4.0, isTotal: false },
      { name: 'SAA\nTilt', value: 2.2, isTotal: false },
      { name: 'LTCA', value: 6.2, isTotal: true },
      { name: 'Active\nMgmt', value: 1.9, isTotal: false },
      { name: 'Total\nPortfolio', value: 8.1, isTotal: true },
    ],
  },
  sector: {
    'Information Technology': [
      { name: 'Strategic\nBenchmark', value: 20.0, isTotal: false },
      { name: 'SAA\nTilt', value: 2.5, isTotal: false },
      { name: 'LTCA', value: 22.5, isTotal: true },
      { name: 'Active\nMgmt', value: 1.6, isTotal: false },
      { name: 'Total\nPortfolio', value: 24.1, isTotal: true },
    ],
    'Financials': [
      { name: 'Strategic\nBenchmark', value: 14.0, isTotal: false },
      { name: 'SAA\nTilt', value: 1.8, isTotal: false },
      { name: 'LTCA', value: 15.8, isTotal: true },
      { name: 'Active\nMgmt', value: -1.6, isTotal: false },
      { name: 'Total\nPortfolio', value: 14.2, isTotal: true },
    ],
  },
};

// Generate a default waterfall for any item not explicitly defined
export const getExposureWaterfall = (tabKey: string, itemName: string, benchmark: number, totalPortfolio: number): WfItem[] => {
  if (exposureWaterfallData[tabKey]?.[itemName]) return exposureWaterfallData[tabKey][itemName];
  const saaTilt = +(benchmark * 0.12).toFixed(1);
  const strategicBm = +(benchmark - saaTilt).toFixed(1);
  const ltca = benchmark;
  const activeMgmt = +(totalPortfolio - benchmark).toFixed(1);
  return [
    { name: 'Strategic\nBenchmark', value: strategicBm, isTotal: false },
    { name: 'SAA\nTilt', value: saaTilt, isTotal: false },
    { name: 'LTCA', value: ltca, isTotal: true },
    { name: 'Active\nMgmt', value: activeMgmt, isTotal: false },
    { name: 'Total\nPortfolio', value: totalPortfolio, isTotal: true },
  ];
};

// Exposure waterfall time series (period-aware)
export const exposureWaterfallTimeSeries = (benchmark: number, totalPortfolio: number, period: string = '1Y') => {
  const labels = periodLabels[period as keyof typeof periodLabels] || months;
  const saaTilt = benchmark * 0.12;
  const strategicBm = benchmark - saaTilt;
  const activeMgmt = totalPortfolio - benchmark;
  return labels.map(m => ({
    month: m,
    'Strategic Benchmark': +(strategicBm + (Math.random() - 0.5) * 1.5).toFixed(1),
    'SAA Tilt': +(saaTilt + (Math.random() - 0.5) * 0.8).toFixed(1),
    'Active Mgmt': +(activeMgmt + (Math.random() - 0.5) * 1.2).toFixed(1),
  }));
};


// ============ EXPOSURE BREAKDOWN BY DIMENSION ============
const breakdownDimensions: Record<string, string[]> = {
  Sector: ['Info Tech', 'Financials', 'Healthcare', 'Cons Disc', 'Industrials', 'Energy', 'Materials', 'Utilities'],
  Country: ['United States', 'United Kingdom', 'Japan', 'China', 'Germany', 'France', 'Canada', 'Australia'],
  'Asset Class': ['Pub Equities', 'Fixed Income', 'Real Estate', 'Infrastructure', 'Private Equity', 'Commodities'],
  Currency: ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'AUD', 'CAD'],
  Name: ['Apple', 'Microsoft', 'NVIDIA', 'Amazon', 'Alphabet', 'Meta', 'Berkshire', 'Tesla'],
};

// Deterministic pseudo-random from string seed
function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  return () => { h = Math.imul(h ^ (h >>> 16), 0x45d9f3b); h = Math.imul(h ^ (h >>> 13), 0x45d9f3b); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
}

export const getExposureBreakdown = (
  itemName: string,
  totalValue: number,
  groupByDimension: string,
): { name: string; value: number }[] => {
  const labels = breakdownDimensions[groupByDimension] || breakdownDimensions['Sector'];
  const rng = seededRandom(`${itemName}-${groupByDimension}`);
  const raw = labels.map(() => rng());
  const sum = raw.reduce((a, b) => a + b, 0);
  return labels
    .map((label, i) => ({ name: label, value: +((raw[i] / sum) * totalValue).toFixed(1) }))
    .sort((a, b) => b.value - a.value);
};

// ============ RISK DATA ============
export const riskMetrics = {
  trackingError: { value: 2.8, limit: 5.0, unit: '%' },
  stressLoss: { value: -12.5, limit: -20.0, unit: '%' },
  externalBorrowing: { value: 8.2, limit: 15.0, unit: '%' },
};

export const trackingErrorSeries = months.map((m, i) => ({
  month: m,
  trackingError: +(2.5 + Math.sin(i / 3) * 0.8 + Math.random() * 0.3).toFixed(2),
  totalVol: +(8.5 + Math.sin(i / 4) * 1.5 + Math.random() * 0.5).toFixed(2),
  benchmarkVol: +(7.8 + Math.sin(i / 4) * 1.2 + Math.random() * 0.4).toFixed(2),
}));

export const riskContribution = [
  { name: 'Global Equities Alpha', contribution: 0.85, ownTE: 3.2 },
  { name: 'EM Debt Opportunities', contribution: 0.45, ownTE: 5.1 },
  { name: 'Real Estate Core', contribution: 0.22, ownTE: 2.8 },
  { name: 'Infrastructure Growth', contribution: 0.18, ownTE: 3.5 },
  { name: 'Private Equity Co-Invest', contribution: 0.65, ownTE: 8.2 },
  { name: 'Systematic Macro', contribution: 0.35, ownTE: 6.5 },
  { name: 'Credit Opportunities', contribution: 0.28, ownTE: 4.1 },
  { name: 'Commodity Trading', contribution: 0.15, ownTE: 7.8 },
];

// Stress/resilience waterfall
export const resilienceWaterfallData = {
  stressLoss: [
    { name: 'Strategic Portfolio', value: -18.5, isTotal: false },
    { name: 'MTS', value: -1.2, isTotal: false },
    { name: 'Active Strategies', value: 2.8, isTotal: false },
    { name: 'Total Portfolio', value: -16.9, isTotal: true },
  ],
  etl: [
    { name: 'Strategic Portfolio', value: -12.2, isTotal: false },
    { name: 'MTS', value: -0.8, isTotal: false },
    { name: 'Active Strategies', value: 1.5, isTotal: false },
    { name: 'Total Portfolio', value: -11.5, isTotal: true },
  ],
};

// ============ BORROWING TABLE ============
export const borrowingData = [
  { strategy: 'Real Estate Strategies', direct: 5.2, sigIndirect: 2.1, otherIndirect: 1.5, ltv: 0.35, leverage: 1.42 },
  { strategy: 'Infrastructure Strategies', direct: 3.8, sigIndirect: 1.5, otherIndirect: 0.8, ltv: 0.28, leverage: 1.35 },
  { strategy: 'Private Equity Strategies', direct: 0.0, sigIndirect: 4.2, otherIndirect: 2.1, ltv: 0.45, leverage: 1.68 },
  { strategy: 'Integrated Strategies', direct: 1.5, sigIndirect: 0.8, otherIndirect: 0.5, ltv: 0.18, leverage: 1.15 },
  { strategy: 'Enhanced ILB Strategy', direct: 2.1, sigIndirect: 0.5, otherIndirect: 0.3, ltv: 0.12, leverage: 1.08 },
];

export const liquidityCoverageData = [
  { category: 'Supply', item: 'Cash & Near-Cash', current: 15.2, gfc: 8.5, stagflation: 10.1 },
  { category: 'Supply', item: 'Committed Credit Lines', current: 12.8, gfc: 12.8, stagflation: 12.8 },
  { category: 'Demand', item: 'Margin Calls', current: -5.2, gfc: -18.5, stagflation: -12.2 },
  { category: 'Demand', item: 'Redemptions', current: -3.1, gfc: -8.2, stagflation: -6.5 },
  { category: 'Demand', item: 'Capital Calls', current: -4.5, gfc: -2.1, stagflation: -3.2 },
];

// ============ MARKET PERFORMANCE ============
export const equityCountryPerf = [
  { name: 'United States', value: 12.5 }, { name: 'Japan', value: 8.2 },
  { name: 'United Kingdom', value: 5.8 }, { name: 'Germany', value: 6.1 },
  { name: 'France', value: 4.5 }, { name: 'China', value: -2.1 },
  { name: 'India', value: 15.2 }, { name: 'South Korea', value: 3.8 },
  { name: 'Canada', value: 7.2 }, { name: 'Australia', value: 6.5 },
];

export const equitySectorPerf = [
  { name: 'Information Technology', value: 18.5 }, { name: 'Healthcare', value: 8.2 },
  { name: 'Financials', value: 10.1 }, { name: 'Consumer Disc.', value: 5.5 },
  { name: 'Industrials', value: 7.8 }, { name: 'Energy', value: -3.2 },
  { name: 'Materials', value: 2.1 }, { name: 'Utilities', value: 4.5 },
];

export const fiPerf = [
  { name: 'US Treasuries', yield: 4.25, spread: 0 }, { name: 'German Bunds', yield: 2.85, spread: 0 },
  { name: 'UK Gilts', yield: 4.12, spread: 0 }, { name: 'Japan JGBs', yield: 0.85, spread: 0 },
  { name: 'US IG Corp', yield: 5.45, spread: 120 }, { name: 'US HY Corp', yield: 8.25, spread: 400 },
  { name: 'EM Sovereign', yield: 6.85, spread: 260 },
];

export const commodityPerf = [
  { name: 'Precious Metals', value: 8.5 }, { name: 'Industrial Metals', value: 3.2 },
  { name: 'Agriculture', value: -1.5 }, { name: 'Energy', value: -5.2 },
  { name: 'Livestock', value: 2.1 },
];

export const currencyPerf = [
  { name: 'EUR/USD', value: -2.1, group: 'Developed' }, { name: 'GBP/USD', value: 1.5, group: 'Developed' },
  { name: 'JPY/USD', value: -5.2, group: 'Developed' }, { name: 'CHF/USD', value: 0.8, group: 'Developed' },
  { name: 'AUD/USD', value: -1.2, group: 'Developed' }, { name: 'CAD/USD', value: 0.5, group: 'Developed' },
  { name: 'CNY/USD', value: -3.5, group: 'Emerging' }, { name: 'INR/USD', value: -2.8, group: 'Emerging' },
  { name: 'BRL/USD', value: -8.5, group: 'Emerging' }, { name: 'KRW/USD', value: -1.8, group: 'Emerging' },
];

// Market time series
export const marketTimeSeries = (items: { name: string }[]) =>
  months.map((m, i) => {
    const base: Record<string, string | number> = { month: m };
    items.forEach(item => {
      base[item.name] = +((i + 1) * (Math.random() * 2 - 0.5) + Math.random() * 2).toFixed(2);
    });
    return base;
  });

// ============ REAL RETURN ============
export const realReturnWaterfall = {
  '1Y': [
    { name: 'Nominal Return', value: 10.5, isTotal: false },
    { name: 'Currency Return', value: -1.2, isTotal: false },
    { name: 'Inflation', value: -3.2, isTotal: false },
    { name: 'Real Return', value: 6.1, isTotal: true },
  ],
  '3Y': [
    { name: 'Nominal Return', value: 8.2, isTotal: false },
    { name: 'Currency Return', value: -0.8, isTotal: false },
    { name: 'Inflation', value: -2.8, isTotal: false },
    { name: 'Real Return', value: 4.6, isTotal: true },
  ],
};

export const eltrrorData = [
  { name: 'Public Equities', value: 7.5 }, { name: 'Fixed Income', value: 3.2 },
  { name: 'Real Estate', value: 5.8 }, { name: 'Infrastructure', value: 6.2 },
  { name: 'Private Equity', value: 9.5 }, { name: 'Commodities', value: 4.1 },
];

export const inflationByCountry = [
  { name: 'United States', value: 3.2 }, { name: 'Eurozone', value: 2.8 },
  { name: 'United Kingdom', value: 4.1 }, { name: 'Japan', value: 1.5 },
  { name: 'China', value: 0.8 }, { name: 'India', value: 5.2 },
  { name: 'Brazil', value: 4.8 },
];

// ============ PEERS ============
export const peersData = [
  { name: 'GIC', returns: 7.5, volatility: 8.2, sharpe: 0.91, ir: 0.45, eqBeta: 0.65 },
  { name: 'Temasek', returns: 9.2, volatility: 12.5, sharpe: 0.74, ir: 0.38, eqBeta: 0.82 },
  { name: 'NBIM (Norway)', returns: 8.8, volatility: 10.1, sharpe: 0.87, ir: 0.52, eqBeta: 0.75 },
  { name: 'ADIA', returns: 7.2, volatility: 7.8, sharpe: 0.92, ir: 0.41, eqBeta: 0.58 },
  { name: 'CPP Investments', returns: 8.1, volatility: 9.5, sharpe: 0.85, ir: 0.48, eqBeta: 0.72 },
  { name: 'CDPQ', returns: 7.8, volatility: 9.2, sharpe: 0.85, ir: 0.43, eqBeta: 0.68 },
  { name: 'QIA', returns: 6.5, volatility: 7.5, sharpe: 0.87, ir: 0.35, eqBeta: 0.55 },
  { name: 'Our Portfolio', returns: 10.5, volatility: 9.8, sharpe: 1.07, ir: 0.62, eqBeta: 0.70 },
];

export const peerAssetMix = [
  { peer: 'GIC', equities: 38, fi: 28, re: 15, infra: 8, pe: 8, other: 3 },
  { peer: 'Temasek', equities: 52, fi: 12, re: 10, infra: 12, pe: 10, other: 4 },
  { peer: 'NBIM', equities: 70, fi: 25, re: 5, infra: 0, pe: 0, other: 0 },
  { peer: 'ADIA', equities: 35, fi: 20, re: 12, infra: 10, pe: 15, other: 8 },
  { peer: 'CPP', equities: 32, fi: 22, re: 8, infra: 12, pe: 20, other: 6 },
  { peer: 'CDPQ', equities: 34, fi: 28, re: 12, infra: 10, pe: 12, other: 4 },
  { peer: 'QIA', equities: 30, fi: 25, re: 18, infra: 8, pe: 12, other: 7 },
  { peer: 'Our Portfolio', equities: 43, fi: 23, re: 12, infra: 9, pe: 9, other: 4 },
];

export const peerCountryMix = [
  { peer: 'GIC', us: 35, europe: 25, asia: 30, other: 10 },
  { peer: 'Temasek', us: 25, europe: 15, asia: 50, other: 10 },
  { peer: 'NBIM', us: 42, europe: 32, asia: 18, other: 8 },
  { peer: 'ADIA', us: 38, europe: 22, asia: 25, other: 15 },
  { peer: 'CPP', us: 40, europe: 20, asia: 22, other: 18 },
  { peer: 'CDPQ', us: 35, europe: 28, asia: 20, other: 17 },
  { peer: 'QIA', us: 30, europe: 25, asia: 20, other: 25 },
  { peer: 'Our Portfolio', us: 42, europe: 22, asia: 25, other: 11 },
];

// Cumulative return series for peers
export const peerReturnSeries = months.map((m, i) => {
  const base: Record<string, string | number> = { month: m };
  peersData.forEach(p => {
    base[p.name] = +((i + 1) * (p.returns / 12) + (Math.random() - 0.5) * 0.5).toFixed(2);
  });
  return base;
});

// Chart colors palette
export const CHART_COLORS = [
  'hsl(212, 72%, 42%)', 'hsl(185, 58%, 38%)', 'hsl(145, 52%, 42%)',
  'hsl(38, 90%, 50%)', 'hsl(0, 72%, 51%)', 'hsl(215, 20%, 58%)',
  'hsl(265, 50%, 55%)', 'hsl(340, 65%, 48%)', 'hsl(170, 50%, 40%)',
  'hsl(28, 80%, 52%)',
];
