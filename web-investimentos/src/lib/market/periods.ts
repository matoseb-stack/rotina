export const PERIODS = ["1D", "5D", "1M", "6M", "1Y", "ALL"] as const;
export type Period = (typeof PERIODS)[number];
