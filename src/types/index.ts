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
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  contactName?: string;
  contactPhone?: string;
  email?: string;
  notes?: string;
  creditLimit?: number;
  creditDays?: number;
  currentCredit?: number;
  qbCustomerId?: string;
  createdAt?: string;
  updatedAt?: string;
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

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  sku?: string;
  type?: string;
  active?: boolean;
  trackQuantity?: boolean;
  quantityOnHand?: number;
  qbProductId?: string;
  createdAt?: string;
  updatedAt?: string;
} 