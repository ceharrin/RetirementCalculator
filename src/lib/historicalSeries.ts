/**
 * Annual US CPI inflation (calendar-year) and S&P 500 total return pairs for bootstrap draws.
 * Values are decimals (e.g. 0.0584 = 5.84%). Illustrative educational dataset, not a forecast;
 * sources are commonly cited aggregates (CPI-U / S&P 500) rounded; methodology differs from SSA
 * or fund reporting.
 */
export interface HistoricalReturnInflationPair {
  calendarYear: number
  inflationRate: number
  portfolioReturn: number
}

export const HISTORICAL_RETURN_INFLATION_PAIRS: readonly HistoricalReturnInflationPair[] = [
  { calendarYear: 1970, inflationRate: 0.0584, portfolioReturn: -0.0095 },
  { calendarYear: 1971, inflationRate: 0.043, portfolioReturn: 0.1079 },
  { calendarYear: 1972, inflationRate: 0.0327, portfolioReturn: 0.0878 },
  { calendarYear: 1973, inflationRate: 0.0618, portfolioReturn: -0.1431 },
  { calendarYear: 1974, inflationRate: 0.1105, portfolioReturn: -0.2197 },
  { calendarYear: 1975, inflationRate: 0.0914, portfolioReturn: 0.37 },
  { calendarYear: 1976, inflationRate: 0.0574, portfolioReturn: 0.2383 },
  { calendarYear: 1977, inflationRate: 0.065, portfolioReturn: -0.0698 },
  { calendarYear: 1978, inflationRate: 0.0759, portfolioReturn: 0.0651 },
  { calendarYear: 1979, inflationRate: 0.1135, portfolioReturn: 0.1869 },
  { calendarYear: 1980, inflationRate: 0.1252, portfolioReturn: 0.3174 },
  { calendarYear: 1981, inflationRate: 0.0892, portfolioReturn: -0.047 },
  { calendarYear: 1982, inflationRate: 0.0383, portfolioReturn: 0.2042 },
  { calendarYear: 1983, inflationRate: 0.0379, portfolioReturn: 0.2234 },
  { calendarYear: 1984, inflationRate: 0.0395, portfolioReturn: 0.0646 },
  { calendarYear: 1985, inflationRate: 0.0377, portfolioReturn: 0.3173 },
  { calendarYear: 1986, inflationRate: 0.011, portfolioReturn: 0.1867 },
  { calendarYear: 1987, inflationRate: 0.0443, portfolioReturn: 0.0525 },
  { calendarYear: 1988, inflationRate: 0.0442, portfolioReturn: 0.1681 },
  { calendarYear: 1989, inflationRate: 0.0465, portfolioReturn: 0.3148 },
  { calendarYear: 1990, inflationRate: 0.0539, portfolioReturn: -0.0306 },
  { calendarYear: 1991, inflationRate: 0.0423, portfolioReturn: 0.3023 },
  { calendarYear: 1992, inflationRate: 0.0303, portfolioReturn: 0.0761 },
  { calendarYear: 1993, inflationRate: 0.0296, portfolioReturn: 0.0997 },
  { calendarYear: 1994, inflationRate: 0.0261, portfolioReturn: 0.0133 },
  { calendarYear: 1995, inflationRate: 0.0281, portfolioReturn: 0.372 },
  { calendarYear: 1996, inflationRate: 0.0293, portfolioReturn: 0.2268 },
  { calendarYear: 1997, inflationRate: 0.0234, portfolioReturn: 0.331 },
  { calendarYear: 1998, inflationRate: 0.0155, portfolioReturn: 0.2834 },
  { calendarYear: 1999, inflationRate: 0.0219, portfolioReturn: 0.2089 },
  { calendarYear: 2000, inflationRate: 0.0338, portfolioReturn: -0.091 },
  { calendarYear: 2001, inflationRate: 0.0283, portfolioReturn: -0.1185 },
  { calendarYear: 2002, inflationRate: 0.0159, portfolioReturn: -0.2197 },
  { calendarYear: 2003, inflationRate: 0.0227, portfolioReturn: 0.2836 },
  { calendarYear: 2004, inflationRate: 0.0268, portfolioReturn: 0.1074 },
  { calendarYear: 2005, inflationRate: 0.0339, portfolioReturn: 0.0483 },
  { calendarYear: 2006, inflationRate: 0.0323, portfolioReturn: 0.1561 },
  { calendarYear: 2007, inflationRate: 0.0285, portfolioReturn: 0.0548 },
  { calendarYear: 2008, inflationRate: 0.0384, portfolioReturn: -0.3655 },
  { calendarYear: 2009, inflationRate: -0.0036, portfolioReturn: 0.2594 },
  { calendarYear: 2010, inflationRate: 0.0164, portfolioReturn: 0.1482 },
  { calendarYear: 2011, inflationRate: 0.0316, portfolioReturn: 0.0211 },
  { calendarYear: 2012, inflationRate: 0.0207, portfolioReturn: 0.1589 },
  { calendarYear: 2013, inflationRate: 0.0146, portfolioReturn: 0.3215 },
  { calendarYear: 2014, inflationRate: 0.0162, portfolioReturn: 0.1352 },
  { calendarYear: 2015, inflationRate: 0.0012, portfolioReturn: 0.0138 },
  { calendarYear: 2016, inflationRate: 0.0126, portfolioReturn: 0.1177 },
  { calendarYear: 2017, inflationRate: 0.0213, portfolioReturn: 0.2161 },
  { calendarYear: 2018, inflationRate: 0.0244, portfolioReturn: -0.0423 },
  { calendarYear: 2019, inflationRate: 0.0181, portfolioReturn: 0.3121 },
  { calendarYear: 2020, inflationRate: 0.0125, portfolioReturn: 0.1802 },
  { calendarYear: 2021, inflationRate: 0.047, portfolioReturn: 0.2847 },
  { calendarYear: 2022, inflationRate: 0.08, portfolioReturn: -0.1804 },
  { calendarYear: 2023, inflationRate: 0.034, portfolioReturn: 0.263 },
]
