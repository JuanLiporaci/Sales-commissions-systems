export interface Sale {
  id: string;
  date: Date;
  amount: number;
  type: 'COD' | 'CREDIT';
  customerId: string;
  repId: string;
}

export interface Customer {
  id: string;
  name: string;
  creditLimit: number;
  creditDays: number;
  currentCredit: number;
}

export interface Delivery {
  id: string;
  date: Date;
  saleId: string;
  area: string;
  distance: number;
  amount: number;
}

export interface Rep {
  id: string;
  name: string;
  dailyGain: number;
  cashOutAvailable: number;
  forecastAccuracy: number;
}

export interface DashboardMetrics {
  totalSales: number;
  codPercentage: number;
  creditPercentage: number;
  deliveriesThisMonth: number;
  averageDollarsPerDelivery: number;
  deliveriesPerArea: Record<string, number>;
} 