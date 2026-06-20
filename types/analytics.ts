export interface SectorInfo {
  key: string;
  name: string;
  color: string;
}

export interface AnalyticsKPIs {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  resolutionRate: number;
}

export interface AreaTrend {
  month: string;
  total: number;
  resolved: number;
}
